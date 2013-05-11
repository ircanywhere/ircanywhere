import math
import urllib
import base64
import bson
import notfound
import time
from datetime import date as rdate, datetime, timedelta
from websites.ircanywhere import app, helper, config
from flask import render_template, request

class Controller(object):
	def __init__(self):
		self.user = None
		self.username = ''

	def checkAccess(self):
		session_id = request.cookies.get('session-id')
		session_id = '' if session_id == None else session_id
		self.user = config.checkSession(session_id)
		# get the cookies and set up a user dictionary

		if session_id == '' or self.user == False:
			return False
		# invalid user, return an empty array

		self.username = self.user['account']

		return True

	def getNetworkList(self, selected, target):
		initial = {'items': {}}
		reducer = 'function(obj, prev) { prev.csum += obj.c; }'
		logs_found = config.db.buffers.find({'account': self.username}).distinct('network')
		log_nets = []
		logs = []

		for doc in logs_found:
			network_id = str(doc)
			network_exists = True if network_id in self.user['networks'] else False
			# get nickname

			if network_exists == False:
				continue;
			# we aint connected to this network, don't show the logs

			network = self.user['networks'][network_id]
			nick = network['nick'].lower()

			#n_logs_found = config.db.buffers.group({'target': 1, 'status': 0, 'nick': 0}, {'account': self.username, 'network': doc}, initial, reducer)
			n_logs_found = config.db.buffers.aggregate([
				{'$match': {'network': doc}},
				{'$group': {'_id': {'status': '$status', 'target': '$target'}}}
			])

			select = ' selected' if selected == network_id else ''
			url = 'logs/%s/%s' % (network['url'], urllib.quote_plus(network['host']))
			log_nets.append({'network': network_id, 'name': network['url'], 'selected': select, 'url': url})
			chans = []
			isset = {}

			for log_doc_id in n_logs_found['result']:
				log_doc = log_doc_id['_id']

				if log_doc['status'] == True or log_doc['target'] == '*' or log_doc['target'] == network['host']:
					if network['host'] not in isset:
						select = ' selected' if target == network['host'] else ''
						url = 'logs/%s/%s' % (network['url'], urllib.quote_plus(network['host']))
						chans.append({'log': urllib.quote_plus(network['host']), 'name': network['host'], 'selected': select, 'url': url})
						isset[network['host']] = True

					continue
				else:
					if log_doc['target'] not in isset:
						select = ' selected' if target == log_doc['target'] else ''
						url = 'logs/%s/%s' % (network['url'], urllib.quote_plus(log_doc['target']))
						chans.append({'log': urllib.quote_plus(log_doc['target']), 'name': log_doc['target'], 'selected': select, 'url': url})
						isset[log_doc['target']] = True

			if network_id == selected:
				logs = chans

		return {'log_nets': log_nets, 'logs': logs}

	def getMessages(self, query, dfrom, nick):
		query['$where'] = 'this.timestamp >= %d && this.timestamp <= %d' % (dfrom * 1000, (dfrom + 86400) * 1000)
		# alter the query

		if query != None:
			logs_found = config.db.buffers.find(query).sort('timestamp', 1)

		if query == None or logs_found.count() == 0:
			return '<div class="no-log-row">There are no logs to display at the moment.</div>'
		# empty array, bail.

		json = []
		ret = []
		for doc in logs_found:
			json.append(doc)
		# find the logs

		for jdoc in json:
			j = helper.parse_irc(base64.b64decode(jdoc['json']))
			msg_parts = j['args']
			if j['command'] == 'PRIVMSG':
				del msg_parts[0]

			jdoc_time = int(jdoc['timestamp'])
			msg = ' '.join(msg_parts)
			msg = msg.replace('<', '>').replace('&lt;', '&rt;')
			# TODO - Parse status stuff and NOTICES

			if j['command'] == 'PRIVMSG':
				html = '<div class="log-row msg clear"><div class="log-row-ts">[%s]</div><div class="log-row-text">&lt;%s&gt; %s</div></div>' % (jdoc_time, j['nick'], msg)
			elif j['command'] == 'JOIN':
				html = '<div class="log-row join clear"><div class="log-row-ts">[%s]</div><div class="log-row-text">%s (%s) has joined %s</div></div>' % (jdoc_time, j['nick'], j['prefix'], j['args'][0])
			elif j['command'] == 'PART':
				html = '<div class="log-row leave clear"><div class="log-row-ts">[%s]</div><div class="log-row-text">%s (%s) has left %s</div></div>' % (jdoc_time, j['nick'], j['prefix'], j['args'][0])
			elif j['command'] == 'QUIT':
				html = '<div class="log-row leave clear"><div class="log-row-ts">[%s]</div><div class="log-row-text">%s (%s) has quit</div></div>' % (jdoc_time, j['nick'], j['prefix'])
			elif j['command'] == 'NICK':
				new_args = ' '.join(j['args']).split(' ')
				del new_args[0]
				html = '<div class="log-row nick clear"><div class="log-row-ts">[%s]</div><div class="log-row-text">%s is now known as %s</div></div>' % (jdoc_time, j['nick'], new_args[0])
			elif j['command'] == 'KICK':
				html = '<div class="log-row leave clear"><div class="log-row-ts">[%s]</div><div class="log-row-text">%s has kicked %s from %s (%s)</div></div>' % (jdoc_time, j['nick'], j['args'][0], j['args'][1], j['args'][2])
			elif j['command'] == 'MODE':
				m_nick = j['server'] if 'nick' not in j else j['nick']
				target = nick if 'target' not in j else j['target']
				if helper.is_channel(target) == True:
					new_modes = ' '.join(j['args']).split(' ')
					del new_modes[0]
				else:
					new_modes = ' '.join(j['args']).split(' ')
					del new_modes[0]
				# alter some variables for this

				html = '<div class="log-row dim clear"><div class="log-row-ts">[%s]</div><div class="log-row-text">%s sets %s</div></div>' % (jdoc_time, m_nick, ' '.join(new_modes))
			elif j['command'] == 'TOPIC':
				new_args = ' '.join(j['args']).split(' ')
				del new_args[0]
				html = '<div class="log-row dim clear"><div class="log-row-ts">[%s]</div><div class="log-row-text">%s has changed the topic to: %s</div></div>' % (jdoc_time, j['nick'], ' '.join(new_args))
			else:
				if j['command'] == 'NOTICE' or j['command'] == '374' or j['command'] == '376' or j['command'] == '372':
					css = ' '
				else:
					css = ' dim '

				new_args = ' '.join(j['args']).split(' ')
				del new_args[0]
				html = '<div class="log-row%sclear"><div class="log-row-ts">[%s]</div><div class="log-row-text">%s</div></div>' % (css, jdoc_time, ' '.join(new_args))

			if html != '':
				ret.append(html)

		return ''.join(ret).decode('utf-8', 'replace')

	def handleChannelView(self, network, target, actual_date):
		net_object = config.db.networks.find_one({'user': self.username, 'url': network})
		if net_object != None:
			network = str(net_object['_id'])
			objectId = bson.ObjectId(oid = network)
		else:
			return notfound.controller.get(), 404
		# try and generate an object id from network, if we can't just return 404

		nick = self.user['nick'].lower() if network not in self.user['networks'] else self.user['networks'][network]['nick'].lower()
		ctype = 'chan' if helper.is_channel(target) else 'query'
		ctype = 'status' if network in self.user['networks'] and target == self.user['networks'][network]['host'] else ctype
		# find the nick and the type

		if ctype == 'chan':
			query = {'account': self.username, 'network': objectId, 'target': target, 'status': False}
		elif ctype == 'query' and target.lower() != nick:
			query = {'account': self.username, 'network': objectId, '$or': [{'target': target}, {'nick': nick}, {'target': nick}], 'status': False, 'privmsg': True}
		elif ctype == 'status':
			query = {'account': self.username, 'network': objectId, 'status': True, 'privmsg': False}
		# generate a query

		actual_date_obj = datetime.strptime(actual_date, '%d-%m-%Y')
		meta = {
			'prefix': '%s/%s' % (net_object['url'], urllib.quote_plus(target)),
			'documents': config.db.buffers,
			'extra_query': query,
			'query_struct': {
				'name': 'timestamp',
				'evaluates': {
					'prev': lambda date: (actual_date_obj - timedelta(days=1)).strftime('%d-%m-%Y'),
					'date': lambda date: (actual_date_obj).strftime('%d-%m-%Y'),
					'next': lambda date: (actual_date_obj + timedelta(days=1)).strftime('%d-%m-%Y')
				}
			}
		}
		# construct meta for the helper.compile_dates function

		try:
			d = helper.compile_dates(meta, actual_date)
		except Exception, e:
			return notfound.controller.get(), 404
		# get the date information. if it fails, usually because of something like
		# ValueError: time data 'wat' does not match format '%d-%m-%Y'
		# at this stage, which is correct

		ld = self.getNetworkList(network, target)
		log_nets = ld['log_nets']
		logs = ld['logs']
		log_data = self.getMessages(query, time.mktime(time.strptime(actual_date, '%d-%m-%Y')), nick)
		# get the list of networks and channels this user has

		if 'X-PJAX' in request.headers:
			template = 'log-channel-view-partial.html'
		else:
			template = 'log-channel-view.html'

		return render_template(template, title = '%s - %s - %s - %s' % (config.config['title'], 'Logs', net_object['url'], target), base_url = config.config['base_url'], prev_date = d['prev'], date = d['date'], next_date = d['next'], log_nets = log_nets, logs = logs, log_data = log_data)
		# render and return the template

	def handleDefaultChannelView(self, network, target):
		net_object = config.db.networks.find_one({'user': self.username, 'url': network})
		if net_object != None:
			network = str(net_object['_id'])
			objectId = bson.ObjectId(oid = network)
		else:
			return notfound.controller.get(), 404
		# try and generate an object id from network, if we can't just return 404

		nick = self.user['nick'].lower() if network not in self.user['networks'] else self.user['networks'][network]['nick'].lower()
		ctype = 'chan' if helper.is_channel(target) else 'query'
		ctype = 'status' if network in self.user['networks'] and target == self.user['networks'][network]['host'] else ctype
		# find the nick and the type

		if ctype == 'chan':
			query = {'account': self.username, 'network': objectId, 'target': target, 'status': False}
		elif ctype == 'query' and target.lower() != nick:
			query = {'account': self.username, 'network': objectId, '$or': [{'target': target}, {'nick': nick}, {'target': nick}], 'status': False, 'privmsg': True}
		elif ctype == 'status':
			query = {'account': self.username, 'network': objectId, 'status': True, 'privmsg': False}
		else:
			query = None
		# generate a query

		if query != None:
			logs_found = config.db.buffers.find(query, {'timestamp': 1}).sort('timestamp', 1)
		else:
			return notfound.controller.get(), 404
		# error occured

		dates = {}
		months = {}

		for doc in logs_found:
			ts = int(math.floor(doc['timestamp'] / 1000))
			ts = datetime.fromtimestamp(ts)
			my = ts.strftime('%m-%Y')
			date = ts.strftime('%d-%m-%Y')

			if 4 <= ts.day <= 20 or 24 <= ts.day <= 30:
				suffix = 'th'
			else:
				suffix = ['st', 'nd', 'rd'][ts.day % 10 - 1]

			day = '%s%s' % (ts.strftime('%A %e'), suffix)

			if my not in dates:
				dates[my] = {}
			if date not in dates[my]:
				dates[my][date] = day
		# determine the dates we have

		for date, data in dates.iteritems():
			ts = datetime.strptime('%s-%s' % ('01', date), '%d-%m-%Y')
			month = ts.strftime('%B %Y')

			if month not in months:
				months[month] = {
					'month': month,
					'days': {}
				}
				# make an empty array if it doesn't exist

			for real_date, day in data.iteritems():
				url = 'logs/%s/%s/%s' % (net_object['url'], urllib.quote_plus(target), real_date)

				months[month]['days'][real_date] = {
					'date': day,
					'day': real_date,
					'url': url
				}
		# construct a months array

		ld = self.getNetworkList(network, target)
		log_nets = ld['log_nets']
		logs = ld['logs']
		# get the list of networks and channels this user has

		if 'X-PJAX' in request.headers:
			template = 'log-def-channel-view-partial.html'
		else:
			template = 'log-def-channel-view.html'

		return render_template(template, title = '%s - %s - %s - %s' % (config.config['title'], 'Logs', net_object['url'], target), base_url = config.config['base_url'], sorted = sorted, len = len(months), months = months, log_nets = log_nets, logs = logs)
		# render and return the template

	def get(self, req_type, network, channel, date):	
		if self.checkAccess() == False:
			return notfound.controller.get(), 404
		elif req_type == 'default-channel-view':
			return self.handleDefaultChannelView(network, channel)
		elif req_type == 'channel-view' and date != None:
			return self.handleChannelView(network, channel, date)
		else:
			return notfound.controller.get(), 404
		# handle a get request for the logs pages

controller = Controller()