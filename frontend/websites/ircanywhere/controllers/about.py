from websites.ircanywhere import app, config
from flask import render_template

class Controller(object):
	def get(self):
		return render_template('about.html', title = '%s - %s' % (config.config['title'], 'About us'), base_url = config.config['base_url'], cdn_url = config.config['cdn_url'], cache_version = config.config['cache_version'])
		# handle a get request for the reset page

controller = Controller()