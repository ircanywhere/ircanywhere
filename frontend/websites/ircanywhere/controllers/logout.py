from websites.ircanywhere import app
from flask import redirect

class Controller(object):
	def get(self):
		response = app.make_response(redirect('/'))
		
		response.set_cookie('session-id', '')
		response.set_cookie('tab-options', '')
		return response

controller = Controller()