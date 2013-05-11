import re
import time as rtime
import math
from websites.ircanywhere import config
from datetime import datetime, timedelta

def is_channel(channel):
	first = channel[:1]
	valid = ['#', '&', '!', '+']
	# we just support all possibilities here, cause its logged and we dont
	# currently know what the server supports.

	if first in valid:
		return True

	return False
# a function to determine if a channel is a valid channel

def parse_irc(line):
	message = {}
	message['line'] = line
	match = re.search(r'^:([^ ]+) +', line)

	if match != None:
		message['prefix'] = match.group(1)
		line = re.sub(r'^:[^ ]+ +', '', line)
		match = re.search(r'^([_a-zA-Z0-9\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$', message['prefix'])
		
		if match != None:
			message['nick'] = match.group(1)
			message['user'] = match.group(3)
			message['host'] = match.group(4)
		else:
			message['server'] = message['prefix']
		# parse up the prefix into nick, user, host, server etc

	match = re.search(r'^([^ ]+) *', line)
	line = re.sub(r'^[^ ]+ +', '', line)
	message['command'] = match.group(1)
	message['rawCommand'] = match.group(1)
	message['commandType'] = 'normal'
	# compose our command array

	message['args'] = []
	middle = ''
	trailing = None
	match = re.search(r'^:|\s+:', line)
	# set some variables

	if match != None:
		match = re.search(r'(.*?)(?:^:|\s+:)(.*)', line)
		middle = match.group(1).rstrip()
		trailing = match.group(2)
	else:
		middle = line
	# parse parameters

	if len(middle) > 0:
		message['args'] = re.split(r'/ +/', middle)

	if trailing != None and len(trailing) > 0:
		message['args'].append(trailing)

	return message
# a function to parse an irc line, ported from node-irc

def compile_dates(meta, current):
	time = ts = datetime.strptime(current, '%d-%m-%Y')
	cur_time = datetime.today()
	d = {}
	query = {}
	dates = {}
	select = {}
	combined = []
	q_struct = meta['query_struct']
	# setup some variables

	all_docs = meta['documents'].find(meta['extra_query'], [q_struct['name']])
	for doc in all_docs:
		ts = int(math.floor(doc[q_struct['name']] / 1000))
		ts = datetime.fromtimestamp(ts)
		month_year = ts.strftime('%m-%Y')
		day_month_year = ts.strftime('%d-%m-%Y')
		# define some variables

		if month_year not in select:
			select[month_year] = []
		elif day_month_year not in select[month_year]:
			select[month_year].append(day_month_year)
		# determine whether to insert this data into the select array

		if day_month_year not in combined:
			combined.append(day_month_year)

	if current == cur_time.strftime('%d-%m-%Y'):
		time = int(rtime.time())
		current = cur_time.strftime('%d-%m-%Y')
	# reset the date object just incase

	if d.has_key('select') == False:
		d['select'] = {}

	for month, days in select.iteritems():
		actual_month = datetime.strptime('01-' + month, '%d-%m-%Y').strftime('%B %Y')

		d['select'][actual_month] = {}
		for day in days:
			daytime = datetime.strptime(day, '%d-%m-%Y')
			if 4 <= daytime.day <= 20 or 24 <= daytime.day <= 30:
				suffix = 'th'
			else:
				suffix = ['st', 'nd', 'rd'][daytime.day % 10 - 1]

			d['select'][actual_month][day] = '%s%s' % (daytime.strftime('%A %e'), suffix)
	# first we try and grab some data from the database
	# so we can construct our day and month select viewer

	query = meta['extra_query']
	for name, execf in q_struct['evaluates'].iteritems():
		dates[name] = execf(time)
		ts_query = int(math.floor(int(datetime.strptime(dates[name], '%d-%m-%Y').strftime('%s')) * 1000))

		if name == 'prev':
			query['timestamp'] = {'$lt': 0, '$gt': ts_query}
		elif name == 'next':
			query['timestamp']['$lt'] = ts_query + (86400 * 1000)
	# build our query

	combined.sort()
	documents = meta['documents'].find(query, [q_struct['name']])
	docs = {}

	for doc in documents:
		docdate = datetime.fromtimestamp(math.floor(doc['timestamp'] / 1000)).strftime('%d-%m-%Y')
		docs[docdate] = doc
	# perform our query and build up a docs array

	for dtype, date in dates.iteritems():
		if date in docs:
			d[dtype] = {
				'prefix': meta['prefix'],
				'real': date,
				'text': datetime.strptime(date, '%d-%m-%Y').strftime('%d %B %Y'),
				'disabled': ' disabled' if date == current else ''
			}
		else:
			index = combined.index(dates['date'])
			offset = (index - 1) if dtype == 'prev' else (index + 1)

			try:
				date = combined[offset]
			except Exception, e:
				''' don't do anything '''

			d[dtype] = {
				'prefix': meta['prefix'],
				'real': date,
				'text': datetime.strptime(date, '%d-%m-%Y').strftime('%d %B %Y'),
				'disabled': ' disabled' if date not in combined else ''
			}
	# find the date of the current document and the previous documents

	return d
# a function to compile a date object array to be used in the log viewer