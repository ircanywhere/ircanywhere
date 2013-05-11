import os
from websites.ircanywhere import app, config

class Controller(object):
	def __init__(self):
		self.cache_time = 0
		self.cached = 'js/cache/javascript.js'
		self.files = [
			'js/deps/plugins-combined.js',
			'js/deps/backbone.js',
			'js/app/templates.js',
			'js/app/helper.js',
			'js/app/parser.js',
			'js/app/socketengine.js',
			'js/app/router.js',
			'js/views/input.js',
			'js/views/main.js',
			'js/views/userlist.js',
			'js/views/tab.js',
			'js/views/bufferlist.js',
			'js/views/buffermessage.js',
			'js/views/buffernotice.js',
			'js/views/bufferother.js',
			'js/views/bufferwhois.js',
			'js/views/bufferwindownotice.js',
			'js/models/tabs.js',
			'js/models/parser.js',
			'js/models/eventhandler.js',
			'js/models/users.js',
			'js/models/userinfoparser.js',
			'js/collections/tabs.js',
			'js/collections/users.js',
			'js/app/main.js'
		]

	def combine_js(self, use_cache):
		javascript = ''
		base = os.path.dirname(os.path.abspath(__file__))

		if use_cache == True and os.path.isfile('%s/../static/%s' % (base, self.cached)):
			f = open('%s/../static/%s' % (base, self.cached), 'r')
			javascript = f.read()
		# first we find a cached version if we need to
		else:
			for filename in self.files:
				f = open('%s/../static/%s' % (base, filename), 'r')
				javascript += f.read()
				f.close()

			f = open('%s/../static/%s' % (base, self.cached), 'w')
			f.write(javascript)
			f.close()
			# we've compiled up our javascript now lets save it for later use
		# loop self.files and add all the javascript together

		return javascript
	# a function to get our javascript from all the files in self.files

	def get(self):
		response = app.make_response(self.combine_js(True))
		response.headers['Content-Type'] = 'application/javascript'
		return response

controller = Controller()