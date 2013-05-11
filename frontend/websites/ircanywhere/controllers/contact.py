import re
import simplejson as json
from websites.ircanywhere import app, config
from flask import render_template, request
from smtplib import SMTP
from email.mime.text import MIMEText

class Controller(object):
	def __init__(self):
		self.subject = ''
		self.name = ''
		self.email = ''
		self.message = ''
		self.json = {
			'error': False,
			'error_message': [],
			'success_message': ''
		}
		# setup some variables and a basic json response object

		self.responses = {
			'REQUIRED': 'All fields are required',
			'INVAL_SUBJECT': 'The subject you have entered is too long.',
			'INVAL_NAME': 'The name you have entered is too long.',
			'INVAL_EMAIL': 'The email address you have entered is invalid.',
			'UNSENT_MAIL': 'Your email could not be sent, most likely our issue, try catching us on IRC.',
			'SUCCESS': 'Thank you, your email has been sent to us, we will get back in touch shortly!'
		}
		# setup an object with our response codes and messages

	def compileResponse(self):
		if 'subject' not in request.form or 'your-name' not in request.form or 'email-address' not in request.form or 'message' not in request.form:
			self.json['error_message'].append(self.responses['REQUIRED'])
		else:
			self.subject = request.form['subject']
			self.name = request.form['your-name']
			self.email = request.form['email-address']
			self.message = request.form['message']
			# assign the variables

			if len(self.subject) > 50:
				self.json['error_message'].append(self.responses['INVAL_SUBJECT'])
			# is the subject too long?

			if len(self.name) > 50:
				self.json['error_message'].append(self.responses['INVAL_NAME'])
			# is the name too long?
		
			if not re.match(r'^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$', self.email, re.IGNORECASE):
				self.json['error_message'].append(self.responses['INVAL_EMAIL'])
			# validate the email address

		if len(self.json['error_message']) > 0:
			self.json['error'] = True
		else:
			success = self.sendMail()

			if success == True:
				self.json['success_message'] = self.responses['SUCCESS']
			else:
				self.json['error_message'].append(self.responses['UNSENT_MAIL'])
				self.json['error'] = True
			# has the email sent?

		return app.make_response(json.dumps(self.json))
		# a function to validate inputs and generate a json response

	def sendMail(self):
		try:
			server = SMTP(config.config['mailjet_host'])
			server.set_debuglevel(0)
			server.login(config.config['mailjet_user'], config.config['mailjet_pass'])
			# connect to mailguns smtp

			to = 'support@ircanywhere.com'
			sender = '%s <%s>' % (self.name, 'contact-form@ircanywhere.com')
			reply_to = '%s <%s>' % (self.name, self.email)
			subject = self.subject
			text = self.message
			# construct the variables, reply to etc

			msg = MIMEText(text, 'plain')
			msg['Subject'] = subject
			msg['From'] = sender
			msg['Reply-To'] = reply_to
			msg['To'] = to
			# Create message container

			server.sendmail('contact-form@ircanywhere.com', to, msg.as_string())
			server.quit()
			# send the mail and quit

			return True
		except Exception, error:
			return False
		# a function to attempt to send the email

	def post(self):
		self.json['error'] = False;
		self.json['error_message'] = []
		self.json['success_message'] = ''
		# reset the json responses
		
		response = self.compileResponse()
		return response
		# handle the post requests here

	def get(self):
		return render_template('contact.html', title = '%s - %s' % (config.config['title'], 'Contact us'), base_url = config.config['base_url'], cdn_url = config.config['cdn_url'], cache_version = config.config['cache_version'])
		# handle a get request for the contact page

controller = Controller()