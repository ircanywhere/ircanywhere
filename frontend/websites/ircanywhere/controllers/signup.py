import re
import time
import hashlib
import bson
import base64
import simplejson as json
from random import randint
from websites.ircanywhere import app, config
from flask import render_template, request
from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

class Controller(object):
	def __init__(self):
		self.name = ''
		self.nick = ''
		self.username = ''
		self.email = ''
		self.password = ''
		self.confirm_pass = ''
		self.free_id = '4f57b8ced49a753889df9dea'
		self.json = {
			'error': False,
			'error_message': [],
			'success_message': ''
		}
		# setup some variables and a basic json response object

		self.responses = {
			'REQUIRED': 'All fields are required',
			'INVAL_NAME': 'The name you have entered is too long.',
			'INVAL_NICK': 'The nickname you have entered is invalid.',
			'INVAL_USER': 'The username you have entered is invalid.',
			'USED_USER': 'The username you have entered is already in use.',
			'INVAL_EMAIL': 'The email you have entered is invalid.',
			'USED_EMAIL': 'The email you have entered is already in use.',
			'INVAL_PASS': 'The password you enter must be between 6 and 25 characters.',
			'INVAL_CPASS': 'The passwords you have entered do not match.',
			'SUCCESS': 'Your account has been sucessfully created, you will recieve an email shortly.'
		}
		# setup an object with our response codes and messages

	def handleSignup(self):
		if 'your-name' not in request.form or 'irc-nickname' not in request.form or 'email-address' not in request.form or 'username' not in request.form or 'password' not in request.form or 'confirm-password' not in request.form:
			self.json['error_message'].append(self.responses['REQUIRED'])
		else:
			self.name = request.form['your-name']
			self.nick = request.form['irc-nickname']
			self.email = request.form['email-address']
			self.username = request.form['username']
			self.password = request.form['password']
			self.confirm_pass = request.form['confirm-password']
			# assign the variables

			signup_row_a = config.db.users.find_one({'account': self.username})
			signup_row_e = config.db.users.find_one({'email': self.email})
			# see if we can find the user information

			if len(self.username) < 4 or len(self.username) > 25 or not re.match(r'[a-z0-9-_]*$', self.username, re.IGNORECASE):
				self.json['error_message'].append(self.responses['INVAL_USER'])
			if signup_row_a != None:
				self.json['error_message'].append(self.responses['USED_USER'])
			if len(self.name) > 35:
				self.json['error_message'].append(self.responses['INVAL_NAME'])
			if not re.match(r'[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*$', self.nick, re.IGNORECASE) or len(self.nick) > 30:
				self.json['error_message'].append(self.responses['INVAL_NICK'])
			if not re.match(r'^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$', self.email, re.IGNORECASE):
				self.json['error_message'].append(self.responses['INVAL_EMAIL'])
			if signup_row_e != None:
				self.json['error_message'].append(self.responses['USED_EMAIL'])
			if len(self.password) < 6 or len(self.password) > 25:
				self.json['error_message'].append(self.responses['INVAL_PASS'])
			if self.confirm_pass != self.password:
				self.json['error_message'].append(self.responses['INVAL_CPASS'])
			# validate size and email address validity

		if len(self.json['error_message']) > 0:
			self.json['error'] = True
		else:
			self.insertUser()

		return app.make_response(json.dumps(self.json))
		# a function to validate inputs and generate a json response

	def insertUser(self):
		if self.code_row != None:
			config.db.inviteCodes.update({'code': self.code}, {'valid': False, 'usedBy': self.email})
		# update the code so it can't be used again

		user_rows = config.db.users.count() + 1
		salt = randint(100000, 999999)
		# get the new uid, and generate a new salt

		network = config.settings['defaultNetwork']
		network['nick'] = self.nick
		network['ident'] = 'ia' + str(user_rows)
		network['real'] = self.nick
		network['user'] = self.username

		config.db.networks.insert(network)
		# add the network first

		insert = {
			'account': self.username,
			'account_type': self.free_id,
			'email': self.email,
			'highlight_words': '',
			'ident': network['ident'],
			'ip': '',
			'is_connected': False,
			'networks': [ str(network['_id']) ],
			'nick': self.nick,
			'node': None,
			'password': hashlib.sha512(hashlib.sha512(self.password).hexdigest() + str(salt)).hexdigest(),
			'real': self.name,
			'salt': salt,
			'tab': '',
			'time': int(time.time()),
			'extra': {
				'reset_password_ts': 0,
				'reset_password_link': ''
			},
			'settings': {
				'tab_options': {},
				'timestamp_format': 0,
				'autocompletion': ','
			}
		}

		config.db.users.insert(insert)
		# a function which inserts the user record properly and sends an email out

		try:
			server = SMTP(config.config['smtp_host'])
			server.set_debuglevel(0)
			server.login(config.config['smtp_user'], config.config['smtp_pass'])
			# connect to mailguns smtp
		
			html = render_template('emails/signup.html', name = self.name)
			text = render_template('emails/signup.txt', name = self.name)
			to = '%s <%s>' % (self.name, self.email)
			sender = 'IRCAnywhere <support@ircanywhere.com>'
			subject = 'Welcome to IRCAnywhere'
			# construct the variables, reply to etc

			msg = MIMEMultipart('alternative')
			msg['Subject'] = subject
			msg['From'] = sender
			msg['To'] = to
			# Create message container - the correct MIME type is multipart/alternative

			part1 = MIMEText(html, 'html')
			part2 = MIMEText(text, 'plain')
			msg.attach(part2)
			msg.attach(part1)
			# attach the message

			server.sendmail('support@ircanywhere.com', self.email, msg.as_string())
			server.quit()
			# send the mail and quit
				
		except Exception, error:
			'''email not sent, do nothing, just catch the errors'''

		self.json['success_message'] = self.responses['SUCCESS']
		# a function to attempt to send the email

	def validateCode(self, code):
		if (code != None):
			try:
				self.code = code
				self.code_row = config.db.inviteCodes.find_one({'code': self.code, 'valid': True})
			except Exception, e:
				self.is_open = False
				self.code_row = None
				return
			# bail immediately if the object id is invalid
		else:
			self.code_row = None
		# is there a code?

		if (config.config.get('newSignups', False) == True) or (code != None and self.code_row != None):
			self.is_open = True
		else:
			self.is_open = False
		# are new signups allowed? or is the code valid

	def post(self, code):
		self.json['error'] = False
		self.json['error_message'] = []
		self.json['success_message'] = ''
		# reset the json responses

		self.validateCode(code)
		# validate code

		if self.is_open == True:
			return self.handleSignup()
		# are we allowed to continue?

	def get(self, code):
		self.validateCode(code)
		# validate code

		return render_template('signup.html', title = '%s - %s' % (config.config['title'], 'Signup'), base_url = config.config['base_url'], open = self.is_open)
		# handle a get request for the signup page

controller = Controller()
