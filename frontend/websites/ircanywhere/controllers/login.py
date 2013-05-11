import time
import hashlib
import simplejson as json
from websites.ircanywhere import app, config
from flask import request

class Controller(object):
	def __init__(self):
		self.username = ''
		self.password = ''
		self.json = {
			'logged_in': False,
			'error': ''
		}
		# setup some variables and a basic json response object

	def invalid_login(self):
		self.json['logged_in'] = False
		self.json['error'] = 'Incorrect login details'

		response = app.make_response(json.dumps(self.json))
		
		response.set_cookie('session-id', '')
		response.headers['Content-Type'] = 'application/json'
		return response
		# form hasnt been submitted properly or is invalid

	def post(self):
		if 'login-username' not in request.form or 'login-pass' not in request.form:
			return self.invalid_login()
		else:
			self.username = request.form['login-username']
			self.password = request.form['login-pass']
			user = config.checkLogin(self.username, self.password)
			# got the correct data, attempt to evaluate it

			if user == False:
				return self.invalid_login()
			else:
				self.json['logged_in'] = True
				self.json['error'] = ''

				response = app.make_response(json.dumps(self.json))
				session_id = hashlib.md5(user['account'] + user['password'] + str(int(time.time()))).hexdigest()
				# generate a response and a session id

				config.db.users.update({'account': user['account']}, {'$set': {'session_id': session_id}})
				# update the session id in the database

				response.set_cookie('session-id', session_id)
				response.set_cookie('tab-options', '{}')
				# set the cookies
				
				response.headers['Content-Type'] = 'application/json'
				return response

controller = Controller()