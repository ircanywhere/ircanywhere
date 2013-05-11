import re
import time
import hashlib
import base64
import bson
import notfound
import simplejson as json
from datetime import datetime, date, timedelta
from websites.ircanywhere import app, config
from flask import render_template, request
from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

class Controller(object):
	def __init__(self):
		self.json = {
			'error': False,
			'error_message': [],
			'success_message': ''
		}
		# setup some variables and a basic json response object

		self.responses = {
			'INVAL_URI': 'Invalid request',
			'INVAL_EMAIL': 'The email you have entered is invalid.',
			'INVAL_USER': 'The email you have entered is not in use.',
			'ALREADY_SENT': 'You can only request one password every 24 hours, if you have lost the reset password link, please contact us.',
			'FAILED': 'The email could not be sent, please contact us.',
			'SUCCESS': 'A password reset email has successfully been sent.',

			'PASS_REQUIRED': 'All fields are required.',
			'INVAL_ACC': 'The account id is invalid.',
			'INVAL_PASS': 'The password you have entered is invalid.',
			'MISMATCH_PASS': 'The passwords you have entered do not match.',
			'SUCCESS_PASS': 'Your password has been successfully updated, you may now login with your new password.'
		}
		# setup an object with our response codes and messages

	def handleRequest(self):
		email_sent = False
		email = '' if 'reset-email' not in request.form else request.form['reset-email']
		
		signup_row = config.db.users.find_one({'email': email})
		# see if we can find the user information

		if not re.match(r'^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$', email, re.IGNORECASE):
			self.json['error_message'].append(self.responses['INVAL_EMAIL'])
		# validate the email

		if signup_row == None:
			self.json['error_message'].append(self.responses['INVAL_USER'])
		elif signup_row != None and (signup_row['extra']['reset_password_ts'] == 0 or signup_row['extra']['reset_password_ts'] < int(time.time())):
			newdate = (date.today() + timedelta(days=1)).strftime('%d-%m-%Y')
			timestamp = int(datetime.strptime(newdate, '%d-%m-%Y').strftime('%s'))

			activate_hash = base64.b64encode('%s;%s' % (signup_row['account'], str(timestamp)[::-1]))
			activate_link = '%sreset/%s' % (config.config['base_url'], activate_hash.replace('=', ''))
			# generate a link

			newdata = {
				'$set': {
					'extra.reset_password_ts': timestamp,
					'extra.reset_password_link': activate_link
				}
			}

			update = config.db.users.update({'_id': signup_row['_id']}, newdata)
			# set a field so we know when they last requested a new password to prevent spamming

			try:
				server = SMTP(config.config['smtp_host'])
				server.set_debuglevel(0)
				server.login(config.config['smtp_user'], config.config['smtp_pass'])
				# connect to mailguns smtp

				html = render_template('emails/reset.html', name = signup_row['real'], link = activate_link)
				text = render_template('emails/reset.txt', name = signup_row['real'], link = activate_link)
				to = '%s <%s>' % (signup_row['real'], signup_row['email'])
				sender = 'IRCAnywhere <support@ircanywhere.com>'
				subject = 'New password for your IRCAnywhere account'
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

				server.sendmail('support@ircanywhere.com', signup_row['email'], msg.as_string())
				server.quit()
				# send the mail and quit
			
				email_sent = True
			except Exception, error:
				print error
				email_sent = False
			# attempt to send the email
		else:
			self.json['error_message'].append(self.responses['ALREADY_SENT'])
		# is the email already been sent?

		if len(self.json['error_message']) > 0:
			self.json['error'] = True

		elif email_sent == False:
			self.json['error'] = True
			self.json['error_message'].append(self.responses['FAILED'])
		else:
			self.json['error'] = False
			self.json['success_message'] = self.responses['SUCCESS']
		# check for errors

		return app.make_response(json.dumps(self.json))

	def handleNewPassword(self):
		if 'account-id' not in request.form or 'password' not in request.form or 'confirm-password' not in request.form:
			self.json['error_message'].append(self.responses['PASS_REQUIRED'])
		else:
			try:
				_id = bson.ObjectId(oid = str(request.form['account-id']))
			except Exception, e:
				self.json['error'] = True
				self.json['error_message'].append(self.responses['INVAL_ACC'])
				return app.make_response(json.dumps(self.json))
			# bail immediately if the object id is invalid
			
			password = request.form['password']
			confirm = request.form['confirm-password']
			# setup some variables

			account_row = config.db.users.find_one({'_id': _id})

			if account_row == None:
				self.json['error_message'].append(self.responses['INVAL_ACC'])
			# check account id

			if len(password) < 7 or len(password) > 25:
				self.json['error_message'].append(self.responses['INVAL_PASS'])
			if password != confirm:
				self.json['error_message'].append(self.responses['MISMATCH_PASS'])
			# validate size and email address validity

			if len(self.json['error_message']) > 0:
				self.json['error'] = True
			else:
				password_hash = hashlib.sha512(hashlib.sha512(password).hexdigest() + str(int(account_row['salt']))).hexdigest()
				account_row['extra']['reset_password_ts'] = 0
				account_row['extra']['reset_password_link'] = ''

				newdata = {
					'$set': {
						'password': password_hash,
						'extra': account_row['extra']
					}
				}

				update = config.db.users.update({'_id': _id}, newdata)
				# update the password

				self.json['error'] = False
				self.json['success_message'] = self.responses['SUCCESS_PASS']
			# check for errors

		return app.make_response(json.dumps(self.json))

	def post(self, req_type):
		self.json['error'] = False
		self.json['error_message'] = []
		self.json['success_message'] = ''
		# reset the json responses

		if req_type == 'false':
			return self.handleRequest()
		elif req_type == 'true':
			return self.handleNewPassword()
		else:
			self.json['error'] = True
			self.json['error_message'].append(self.responses['INVAL_URI'])
			return app.make_response(json.dumps(self.json))

	def get(self, _id):
		try:
			real_id = base64.b64decode('%s==' % (_id)).split(';')
			account = real_id[0]
			timestamp = real_id[1][::-1]
			valid = True if int(time.time()) < timestamp else False
			# grab the values

			account_row = config.db.users.find_one({'account': account})
			valid = True if valid and account_row != None else False
			# find account

			return render_template('reset.html', title = '%s - %s' % (config.config['title'], 'Reset your password'), base_url = config.config['base_url'], valid = valid, account_id = account_row['_id'])
			# handle a get request for the reset page
		except Exception, e:
			return notfound.controller.get(), 404

controller = Controller()