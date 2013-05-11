/* ============================================================
 * IRCAnywhere Confidential
 * ============================================================
 * 
 * (C) Copyright 2011 - 2012 IRCAnywhere (https://ircanywhere.com)
 * All Rights Reserved.
 * 
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 *
 * ============================================================ */

var defconf = require('../config.json'),
	mongoose = require('mongoose'),
	ObjectId = mongoose.Schema.ObjectId;

exports.Database = {};
exports.Database.mongoose = mongoose;

/*
* Database::connect

*
* Connect to the database cluster
* 
* Local: ircanywhere:fth387fhjw8@localhost/webclient
*/
exports.Database.connect = function(callback)
{
	var system = require('./system').System,
		_this = this;

	_this.mongoose.connect('mongodb://' + defconf.database, function(err)
	{
		if (err)
			throw err;
	});
	// connect to the database

	mongoose.connection.on('error', function(err)
	{
		system.log.error(err);
	});

	mongoose.connection.on('open', function(err)
	{
		_this.setup(callback);
	});
};

/*
 * Database::getAccountTypes
 *
 * Get the account types from the database
 */
exports.Database.getAccountTypes = function()
{
	var server = require('./server').Server;;

	this.accTypeModel.find({}, function(err, docs)
	{
		for (var doc in docs)
		{
			var newDoc = docs[doc].opt;
				newDoc.name = docs[doc].name;
			server.accountTypes[docs[doc]._id] = newDoc;
		}
	});
	// stuff to be executed once the database is setup.
};

/*
* Database::setup
*
* Setup all the database models
*/
exports.Database.setup = function(callback)
{
	var _this = this;

	var UserModel = new mongoose.Schema({
		account: String,
		account_type: String,
		suspended: Boolean,
		email: String,
		highlight_words: String,
		ident: String,
		ip: String,
		is_connected: Boolean,
		networks: [ObjectId],
		node: ObjectId,
		nick: String,
		password: String,
		real: String,
		salt: String,
		tab: String,
		time: Number,
		session_id: String,
		extra: {},
		settings: {}
	}, { autoIndex: false });

	var NetworkModel = new mongoose.Schema({
		name: String,
		host: String,
		port: String,
		url: String,
		password: String,
		secure: Boolean,
		sasl: Boolean,
		nick: String,
		ident: String,
		real: String,
		user: String,
		ip: String,
		status: String,
		locked: Boolean,
		socket_key: String,
		chans: {},
		extra: {},
		autojoin_chans: {},
		connect_commands: []
	}, { autoIndex: false });

	var NetworkLogsModel = new mongoose.Schema({
		account: String,
		network: ObjectId,
		counter: Number,
		logs: []
	}, { autoIndex: false });

	var ChannelDataModel = new mongoose.Schema({
		network: ObjectId,
		channel: String,
		topic: String,
		modes: String,
		users: {},
		changedUsers: {}
	}, { autoIndex: false });

	var BufferModel = new mongoose.Schema({
		account: String,
		network: ObjectId,
		timestamp: Number,
		read: Boolean,
		nick: String,
		target: String,
		self: Boolean,
		userPrefix: String,
		highlight: Boolean,
		status: Boolean,
		privmsg: Boolean,
		json: String
	}, { autoIndex: false });
	
	var AccTypeModel = new mongoose.Schema({
		name: String,
		opt: {}
	}, { autoIndex: false });

	var NodeModel = new mongoose.Schema({
		hostname: String,
		endpoint: String,
		port: String,
		running: Boolean,
		bootTime: String
	}, { autoIndex: false });
	// set database settings

	_this.userModel = mongoose.model('Users', UserModel);
	_this.networkModel = mongoose.model('Networks', NetworkModel);
	_this.networkLogsModel = mongoose.model('NetworkLogs', NetworkLogsModel, 'networkLogs');
	_this.channelDataModel = mongoose.model('ChannelData', ChannelDataModel, 'channelData');
	_this.bufferModel = mongoose.model('Buffers', BufferModel);
	_this.accTypeModel = mongoose.model('AccountTypes', AccTypeModel, 'accountTypes');
	_this.nodeModel = mongoose.model('Nodes', NodeModel);
	// provision models

	_this.getAccountTypes();
	_this.getAccountTypeTimer = setInterval(_this.getAccountTypes.bind(this), 86400000);
	// stuff to be executed once the database is setup.

	callback();
};