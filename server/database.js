/**
 * IRCAnywhere server/database.js
 *
 * @title Database
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	helper = require('../lib/helpers').Helpers,
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
 * Wrap any callback functions and emit an event so we know the database
 * has been altered.
 *
 * @method _wrap
 * @param {String} collection The collection the event happened on
 * @param {String} action The action, 'insert', 'update' etc
 * @param {Array} args The array of arguments
 * @return void
 */
Database.prototype._wrap = function(collection, action, args) {
	var self = this,
		fn = helper.findFunctionInArray(_, args);

	if (fn === -1) {
		args.push(function(err, data) {
			if (!err && data) {
				self._emit(collection, action, data);
			}
		});
		// else do our own
	}
	else {
		args[fn] = _.wrap(args[fn], function(func) {
			var ags = helper.copyArguments(arguments).slice(1);

			// emit if success
			if (!ags[0] && args[1]) {
				self._emit(collection, action, ags[1]);
			}

			// call original function
			func.apply(func.prototype, ags);
		});
		// if a function exists we need to extend it
	}

	return args;
}

/**
 * Emit an event on the global emitter (basically internal oplog tailing)
 *
 * @method _emit
 * @param {String} collection The collection the event happened on
 * @param {String} action The action, 'insert', 'update' etc
 * @param {Object} data The updated data
 * @return void
 */
Database.prototype._emit = function(collection, action, data) {
	data = (_.isArray(data)) ? data[0] : data;

	application.ee.emit([collection, action], data);
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

/**
 * Insert a record into the database
 *
 * @method insert
 * @param {String} collection Name of the collection
 * @return void
 */
Database.prototype.insert = function(collection) {
	var mongoCollection = this.collections[collection],
		args = helper.copyArguments(arguments).slice(1);

	if (typeof mongoCollection !== 'object') {
		throw new Error('Invalid collection ' + collection + ' for insert()');
	}

	return mongoCollection.insert.apply(mongoCollection, this._wrap(collection, 'insert', args));
}

/**
 * Update a record in the database
 *
 * @method update
 * @param {String} collection Name of the collection
 * @return void
 */
Database.prototype.update = function(collection) {
	var mongoCollection = this.collections[collection],
		args = helper.copyArguments(arguments).slice(1);

	if (typeof mongoCollection !== 'object') {
		throw new Error('Invalid collection ' + collection + ' for update()');
	}

	// insert a sort method in (because we're actually going to use findAndModify)
	args.splice(1, 0, [['_id', 1]]);

	return mongoCollection.findAndModify.apply(mongoCollection, this._wrap(collection, 'update', args));
}

/**
 * Remove a record from the database
 *
 * @method remove
 * @param {String} collection Name of the collection
 * @return void
 */
Database.prototype.remove = function(collection) {
	var mongoCollection = this.collections[collection],
		args = helper.copyArguments(arguments).slice(1);

	if (typeof mongoCollection !== 'object') {
		throw new Error('Invalid collection ' + collection + ' for remove()');
	}

	return mongoCollection.remove.apply(mongoCollection, this._wrap(collection, 'update', args));
}

exports.Database = Database;