from websites.ircanywhere import app, config
from flask import request, render_template

class Controller(object):
	def checkAccess(self):
		session_id = request.cookies.get('session-id')
		session_id = '' if session_id == None else session_id
		user = config.checkSession(session_id)
		# get the cookies and set up a user dictionary

		if session_id == '' or user == False:
			return False
		# invalid user, return an empty array

		return True

	def get(self):
		if self.checkAccess() == False:
			template = render_template('home.html', title = config.config['title'], base_url = config.config['base_url'], cdn_url = config.config['cdn_url'], cache_version = config.config['cache_version'])
		else:
			template = render_template('app.html', title = config.config['title'], base_url = config.config['base_url'], cdn_url = config.config['cdn_url'], cache_version = config.config['cache_version'])

		return template
		# handle a get request for the reset page

controller = Controller()