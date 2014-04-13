/**
 * IRCAnywhere server/factory.js
 *
 * @title IRCFactory
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	hooks = require('hooks'),
	crypto = require('crypto'),
	util = require('util'),
	factory = require('irc-factory').Api,
	helper = require('../lib/helpers').Helpers;

/**
 * The IRCFactory object which handles communication with the irc-factory package
 * This object is not hookable or extendable because plugins can deny the execution of
 * functions when they hook into it, the results could be disasterous. If incoming events
 * need to be hooked onto you could hook onto the IRCHandler object.
 *
 * The default `irc-factory` options are below: ::
 *
 * 	{
 * 		events: 31920,
 * 		rpc: 31930,
 * 		automaticSetup: true
 * 	}
 *
 * The `fork` setting comes from our configuration object and is inserted when `init` is ran. 
 *
 * @class IRCFactory
 * @method IRCFactory
 * @return void
 */
function IRCFactory() {
	var self = this;

	this.api = new factory();

	application.ee.on('ready', function() {
		fibrous.run(self.init.bind(self));
	});
}

/**
 * @member {Object} options The `irc-factory` options to use
 */
IRCFactory.prototype.options = {
	events: 31920,
	rpc: 31930,
	automaticSetup: true
}

/**
 * Initiates the irc factory and it's connection and sets up an event handler
 * when the application is ready to run. 
 *
 * @method init
 * @return void
 */
IRCFactory.prototype.init = function() {
	var self = this,
		interfaces = this.api.connect(_.extend(this.options, {fork: application.config.forkProcess}));
		this.events = interfaces.events,
		this.rpc = interfaces.rpc;
	// connect to our uplinks

	this.events.on('message', function(message) {
		fibrous.run(function() {
			if (message.event === 'synchronize') {
				var networks = networkManager.getClients(),
					keys = _.keys(networks),
					difference = _.difference(keys, message.keys);

				for (var key in message.keys) {
					networkManager.changeStatus({_id: key}, networkManager.flags.connected);
				}
				
				for (var key in difference) {
					networkManager.connectNetwork(networks[difference[key]]);
				}
				// the clients we're going to actually attempt to boot up

				application.logger.log('info', 'factory synchronize', helper.cleanObjectIds(message));
			} else if (message.event === 'uncaughtException') {
				application.logger.log('error', JSON.parse(message.message));
			} else {
				self.handleEvent(message.event, message.message);
			}
		});
	});
}

/**
 * Handles incoming factory events, events are expected to come in the following format: ::
 *
 * 	[ '52d3fc718132f8486dcde1d0', 'privmsg' ] { nickname: 'ricki-',
 * 		username: 'ia1',
 * 		hostname: '127.0.0.1',
 * 		target: '#ircanywhere-test',
 * 		message: '#ircanywhere-test WORD UP BROSEPTH',
 * 		time: '2014-01-22T18:20:57.323Z',
 * 		raw: ':ricki-!ia1@84.19.104.162 PRIVMSG #ircanywhere-test :#ircanywhere-test here is a test' }
 *
 * More advanced docs can be found at https://github.com/ircanywhere/irc-factory/wiki/Events
 *
 * @method handleEvent
 * @param {Array[String]} event A valid event array from irc-factory `['52d3fc718132f8486dcde1d0', 'privmsg']`
 * @param {Object} object A valid event object from irc-factory
 * @return void
 */
IRCFactory.prototype.handleEvent = function(event, object) {
	var key = event[0].toString(),
		e = event[1],
		client = Clients[key];

	if (!client) {
		return application.logger.log('warn', 'Invalid client object for IRCFactory.handleEvent()', {key: key, event: e, data: object});
	}

	if (_.isFunction(ircHandler[e]) && object !== false) {
		fibrous.run(function() {
			ircHandler[e].call(ircHandler, client, object);
		});
	} else {
		application.logger.log('warn', 'Unhandled event in IRCFactory.handleEvent()', {key: key, event: e, data: object});
	}
	
	if (application.verbose) {
		console.log(new Date().toJSON(), '-', util.inspect({key: key, event: e, data: object}, {colors: true}));
	}
}

/**
 * Sends the command to `irc-factory` to create a new irc client with the given settings.
 * If the client already exists it will be dropped by `irc-factory`.
 *
 * @method create
 * @param {Object} network A valid client object
 * @return void
 */
IRCFactory.prototype.create = function(network) {
	var key = network._id.toString();
	// generate a key, we just use the network id because it's unique per network
	// and doesn't need to be linked to a client, saves us hashing keys all the time

	networkManager.changeStatus({_id: key}, networkManager.flags.connecting);
	// mark the network as connecting

	this.rpc.emit('createClient', key, network);
	application.logger.log('info', 'creating irc client', helper.cleanObjectIds(_.omit(Clients[key], 'internal')));
},

/**
 * Sends the command to destroy a client with the given key. If the client doesn't exist
 * the command will just be dropped.
 * 
 * @method destroy
 * @param {ObjectID} key A client key which has the type of a Mongo ObjectID
 * @return void
 */
IRCFactory.prototype.destroy = function(key) {
	application.logger.log('info', 'destroying irc client', helper.cleanObjectIds(_.omit(Clients[key], 'internal')));
	// log it before we destroy it below

	this.rpc.emit('destroyClient', key.toString());
},

/**
 * Calls an RPC command on the irc-factory client, usually used to send
 * commands such as /WHO etc. It's probably best to use CommandManager in most cases
 *
 * @method send
 * @param {ObjectID} key A client key which has the type of a Mongo ObjectID
 * @param {String} command An IRC command to send, such as 'mode' or 'join'
 * @param {Array} args An array of arguments to send delimited by a space.
 * @return void
 */
IRCFactory.prototype.send = function(key, command, args) {
	this.rpc.emit('call', key.toString(), command, args);
}

exports.IRCFactory = IRCFactory;