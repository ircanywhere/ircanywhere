/**
 * IRCAnywhere server/database.js
 *
 * @title Database
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var helper = require('../lib/helpers').Helpers,
	mongo = require('mongodb');

/**
 * This object is responsible for managing the connection to the database layer
 * and interacting with the database. This is an abstraction layer mainly.
 *
 * @class Database
 * @method Database
 * @return void
 */
function Database(config) {
	this.config = config;
	this.database = {
		mongo: this.config.mongo.split(/\//i),
		oplog: this.config.oplog.split(/\//i),
		settings: {
			db: {
				native_parser: true
			},
			server: {
				auto_reconnect: true
			}
			// XXX - Add repl set options and tie to config file
		}
	};

	this.collections = {};
	// An object containing references to all the collections
}

/**
 * Connect to the database
 *
 * @method connect
 * @return void
 */
Database.prototype.connect = function() {
	var self = this;

	mongo.MongoClient.connect(this.config.mongo, this.database.settings, function(err, db) {
		if (err) {
			application.exitProcess = true;
			throw err;
		}

		application.mongo = db;
		application.Nodes = db.collection('nodes');
		application.Users = db.collection('users');
		application.Networks = db.collection('networks');
		application.Tabs = db.collection('tabs');
		application.ChannelUsers = db.collection('channelUsers');
		application.Events = db.collection('events');
		application.Commands = db.collection('commands');
		// XXX - DB LAYER

		self.collections.nodes = db.collection('nodes');
		self.collections.users = db.collection('users');
		self.collections.networks = db.collection('networks');
		self.collections.tabs = db.collection('tabs');
		self.collections.channelUsers = db.collection('channelUsers');
		self.collections.events = db.collection('events');
		self.collections.commands = db.collection('commands');

		application.cleanCollections();
		// ensure the collections are clean if < 0.1-beta

		mongo.MongoClient.connect(self.config.oplog, self.database.settings, function(oerr, odb) {
			if (oerr) {
				application.exitProcess = true;
				throw oerr;
			}

			application.oplog = odb;
			application.Oplog = odb.collection('oplog.rs');

			application.setupOplog();
			// setup the oplog tailer when we connect
		});

		application.setupNode();
		// next thing to do if we're all alright is setup our node
		// this has been implemented now in the way for clustering

		application.setupServer();
		// setup express server

		application.ee.emit('ready');
		// initiate sub-objects
	});
}

/**
 * Query the database
 *
 * @method find
 * @param {String} collection Name of the collection
 * @return void
 */
Database.prototype.find = function(collection) {
	var mongoCollection = this.collections[collection],
		args = helper.copyArguments(arguments).slice(1);

	if (typeof mongoCollection !== 'object') {
		throw new Error('Invalid collection ' + collection + ' for find()');
	}

	return mongoCollection.find.apply(mongoCollection, args);
}

/**
 * Query the database and return one record
 *
 * @method findOne
 * @param {String} collection Name of the collection
 * @return void
 */
Database.prototype.findOne = function(collection) {
	var mongoCollection = this.collections[collection],
		args = helper.copyArguments(arguments).slice(1);

	if (typeof mongoCollection !== 'object') {
		throw new Error('Invalid collection ' + collection + ' for findOne()');
	}

	return mongoCollection.findOne.apply(mongoCollection, args);
}

exports.Database = Database;