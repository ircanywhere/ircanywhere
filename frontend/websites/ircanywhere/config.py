import hashlib
from pymongo import MongoClient

config = {
	'mongo': 'mongodb://localhost/ircanywhere',
	'mongodb': 'ircanywhere',
	'smtp_host': 'smtp.gmail.com',
	'smtp_user': 'username@email.com',
	'smtp_pass': 'password',
	'title': 'IRCAnywhere',
	'base_url': 'http://localhost:5000/',
	'newSignups': True
}
# a config dictionary

connection = MongoClient(config['mongo'])
db = connection[config['mongodb']]
# create our mongo client instance

settings = db.settings.find_one({'initial': True})
# get our settings info

def checkSession(session_id):
	user = db.users.find_one({'session_id': session_id})
	query = {'_id': {'$in': []}}

	if user == None:
		return False

	if len(user['networks']) > 0:
		for nid in user['networks']:
			query['_id']['$in'].append(nid)

		user['networks'] = {}
		networks = db.networks.find(query)
		for network in networks:
			user['networks'][str(network['_id'])] = network
	else:
		user['networks'] = {}

	return user

def checkLogin(username, password):
	user = db.users.find_one({'account': username})
	query = {'_id': {'$in': []}}

	if user == None:
		user = db.users.find_one({'email': username})
	# cant find via username, check the email

	if user == None or (user != None and user['password'] != hashlib.sha512(hashlib.sha512(password).hexdigest() + str(int(user['salt']))).hexdigest()):
		return False
	# invalid details

	if len(user['networks']) > 0:
		for nid in user['networks']:
			query['_id']['$in'].append(nid)

		user['networks'] = {}
		networks = db.networks.find(query)
		for network in networks:
			user['networks'][str(network['_id'])] = network
	else:
		user['networks'] = {}
	
	return user
# function to check whether a user is logged in or not
