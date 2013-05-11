from websites.ircanywhere import app, config
from flask import render_template

class Controller(object):
	def get(self):
		return render_template('notfound.html', title = '%s - %s' % (config.config['title'], 'Page not found'), base_url = config.config['base_url'], cdn_url = config.config['cdn_url'], cache_version = config.config['cache_version'])
		# handle a get request for the reset page

controller = Controller()