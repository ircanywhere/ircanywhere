import random
import simplejson as json
from websites.ircanywhere import app, config
from flask import request

class Controller(object):
	def __init__(self):
		self.collection = config.db.nodes
		self.user = None
		self.username = ''
		self.json = {
			'logged_in': False,
			'username': '',
			'session_id': '',
			'settings': {},
			'endpoint': None
		}
		# setup some variables and a basic json response object

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
		if self.checkAccess() == False:
			response = app.make_response(json.dumps(self.json))
			response.headers['Content-Type'] = 'application/json'
			return response
		# invalid user, return an empty array

		node_object = self.collection.find_one({'_id': self.user['node']})
		
		if node_object == None:
			node_object = self.collection.find(limit = 1, skip = random.randrange(0, self.collection.count()))
			node_object = node_object[0]
		# cant find a node object, get a new one

		self.json['logged_in'] = True
		self.json['username'] = self.username
		self.json['session_id'] = self.user['session_id']
		self.json['settings'] = self.user['settings']
		self.json['endpoint'] = node_object['endpoint']
		# give the return object some information

		response = app.make_response(json.dumps(self.json))
		response.headers['Content-Type'] = 'application/json'
		return response

controller = Controller()