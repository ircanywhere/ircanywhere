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
			return render_template('network.html')
			# have access, render a template

controller = Controller()