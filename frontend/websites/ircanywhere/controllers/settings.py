import re
import hashlib
import simplejson as json
from websites.ircanywhere import app, config
from flask import render_template, request

class Controller(object):
	def __init__(self):
		self.user = None
		self.username = ''
		self.json = {
			'error': False,
			'error_message': [],
			'success_message': ''
		}
		# setup some variables and a basic json response object

		self.responses = {
			'NO_ACCESS': 'You are not logged in',
			'SET_REQUIRED': 'The your name and irc nickname fields are required.',
			'INVAL_NAME': 'The name you have entered is too long.',
			'INVAL_NICK': 'The nickname you have entered is invalid.',
			'INVAL_AUTOC': 'Nick auto completion can only be either of the following , : -',
			'SUCCESS_SET': 'Your settings have been successfully updated.',

			'EMAIL_REQUIRED': 'All fields are required.',
			'INCOR_EMAIL': 'The email you have entered is incorrect.',
			'INVAL_EMAIL': 'The email you have entered is invalid.',
			'USED_EMAIL': 'The email you have entered is already in use.',
			'MISMATCH_EMAIL': 'The email addresses you have entered do not match.',
			'SUCCESS_EMAIL': 'Your email address has been successfully updated.',

			'PASS_REQUIRED': 'All fields are required.',
			'INCOR_PASS': 'The password you have entered is incorrect.',
			'INVAL_PASS': 'The password you have entered is invalid.',
			'MISMATCH_PASS': 'The passwords you have entered do not match.',
			'SUCCESS_PASS': 'Your password has been successfully updated, your cookies are being automatically updated.',
		}
		# setup an object with our response codes and messages
	
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

	def handleSettings(self):
		if 'your-name' not in request.form or 'irc-nickname' not in request.form or 'autocompletion' not in request.form:
			self.json['error_message'].append(self.responses['SET_REQUIRED'])
		else:
			name = request.form['your-name']
			nick = request.form['irc-nickname']
			autocompletion = request.form['autocompletion']
			timestamp_format = 0 if 'timestamp-format' not in request.form else 1
			highlight_words = '' if 'highlight-words' not in request.form else request.form['highlight-words']

			if len(name) > 35:
				self.json['error_message'].append(self.responses['INVAL_NAME'])
			if not re.match(r'[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*$', nick, re.IGNORECASE) or len(nick) > 30:
				self.json['error_message'].append(self.responses['INVAL_NICK'])
			if not re.match(r'^([,|:|\-]|\s+[,|:|\-])$', autocompletion, re.IGNORECASE):
				self.json['error_message'].append(self.responses['INVAL_AUTOC'])
			# validate our inputs

		if len(self.json['error_message']) > 0:
			self.json['error'] = True
		else:
			self.json['error'] = False
			self.json['success_message'] = self.responses['SUCCESS_SET']

			newdata = {
				'$set': {
					'real': name,
					'nick': nick,
					'highlight_words': highlight_words,
					'settings.timestamp_format': timestamp_format,
					'settings.autocompletion': autocompletion
				}
			}
			
			config.db.users.update({'account': self.username}, newdata)
			# update the record in our mongodb

		return app.make_response(json.dumps(self.json))

	def handleEmail(self):
		if 'current-email' not in request.form or 'new-email' not in request.form or 'confirm-email' not in request.form:
			self.json['error_message'].append(self.responses['EMAIL_REQUIRED'])
		else:
			current_email = request.form['current-email']
			new_email = request.form['new-email']
			confirm_email = request.form['confirm-email']
			signup_row = config.db.users.find_one({'email': new_email})

			if current_email != self.user['email']:
				self.json['error_message'].append(self.responses['INCOR_EMAIL'])
			if not re.match(r'^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$', new_email, re.IGNORECASE):
				self.json['error_message'].append(self.responses['INVAL_EMAIL'])
			if signup_row != None:
				self.json['error_message'].append(self.responses['USED_EMAIL'])
			if new_email != confirm_email:
				self.json['error_message'].append(self.responses['MISMATCH_EMAIL'])
			# validate our inputs

			if len(self.json['error_message']) > 0:
				self.json['error'] = True
			else:
				self.json['error'] = False
				self.json['success_message'] = self.responses['SUCCESS_EMAIL']

			newdata = {'$set': {'email': new_email}}
			config.db.users.update({'account': self.username}, newdata)
			# update the record in our mongodb

		return app.make_response(json.dumps(self.json))

	def handlePassword(self):
		if 'current-pass' not in request.form or 'new-pass' not in request.form or 'confirm-pass' not in request.form:
			self.json['error_message'].append(self.responses['PASS_REQUIRED'])
		else:
			current_pass = request.form['current-pass']
			current_hash = hashlib.sha512(hashlib.sha512(current_pass).hexdigest() + str(int(self.user['salt']))).hexdigest()
			new_pass = request.form['new-pass']
			confirm_pass = request.form['confirm-pass']

			if current_hash != self.user['password']:
				self.json['error_message'].append(self.responses['INCOR_PASS'])
			if len(new_pass) < 7 or len(new_pass) > 25:
				self.json['error_message'].append(self.responses['INVAL_PASS'])
			if new_pass != confirm_pass:
				self.json['error_message'].append(self.responses['MISMATCH_PASS'])
			# validate our inputs

			if len(self.json['error_message']) > 0:
				self.json['error'] = True
			else:
				self.json['error'] = False
				self.json['success_message'] = self.responses['SUCCESS_PASS']

			new_pass_hash = hashlib.sha512(hashlib.sha512(new_pass).hexdigest() + str(int(self.user['salt']))).hexdigest()
			newdata = {'$set': {'password': new_pass_hash}}
			config.db.users.update({'account': self.username}, newdata)
			response = app.make_response(json.dumps(self.json))
			# update the record in our mongodb

		response.set_cookie('login-pass-hash', new_pass_hash)
		# over write the cookie so they don't get logged out

		return response

	def post(self, req_type):
		self.json['error'] = False
		self.json['error_message'] = []
		self.json['success_message'] = ''
		# reset the json responses

		if self.checkAccess() == False:
			self.json['error'] = True
			self.json['error_message'].append(self.responses['NO_ACCESS'])

			return app.make_response(json.dumps(self.json))
			# check for access
		else:
			if req_type == 'settings':
				return self.handleSettings()
			elif req_type == 'email':
				return self.handleEmail()
			elif req_type == 'password':
				return self.handlePassword()
			else:
				self.json['error'] = True
				return app.make_response(json.dumps(self.json))
			# we have access, lets continue

	def get(self):
		self.json['error'] = False
		self.json['error_message'] = []
		self.json['success_message'] = ''
		# reset the json responses

		if self.checkAccess() == False:
			self.json['error'] = True
			self.json['error_message'].append(self.responses['NO_ACCESS'])

			return app.make_response(json.dumps(self.json))
			# check for access
		else:
			timestamp_format = ' checked' if self.user['settings']['timestamp_format'] == 1 else ''

			return render_template('settings.html', yourName = self.user['real'], ircNickname = self.user['nick'], highlightWords = self.user['highlight_words'], autoComplete = self.user['settings']['autocompletion'], timestampFormat = timestamp_format)
			# have access, render a template

controller = Controller()