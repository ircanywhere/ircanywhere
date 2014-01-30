var _ = require('lodash'),
	hooks = require('hooks'),
	crypto = require('crypto'),
	factory = require('irc-factory').Api,
	helper = require('../lib/helpers').Helpers;

/**
 * The IRCFactory object which handles communication with the irc-factory package
 * This object is not hookable or extendable because plugins can deny the execution of
 * functions when they hook into it, the results could be disasterous. If incoming events
 * need to be hooked onto you could hook onto the IRCHandler object.
 *
 * @class	IRCFactory
 * @method 	IRCFactory
 * @extend	false
 * @return 	void
 */
function IRCFactory() {
	var self = this;

	this.api = new factory();
	this.options = {
		events: 31920,
		rpc: 31930,
		automaticSetup: true
	};

	application.ee.on('ready', function() {
		fibrous.run(self.init.bind(self));
	});
}

/**
 * Initiates the irc factory and it's connection and sets up an event handler
 * when the application is ready to run
 *
 * @method 	init
 * @extend 	true
 * @return 	void
 */
IRCFactory.prototype.init = function() {
	var self = this,
		interfaces = this.api.connect(_.extend(this.options, {fork: application.config.forkProcess}));
		this.events = interfaces.events,
		this.rpc = interfaces.rpc;
	// connect to our uplinks

	this.events.on('message', function(message) {
		fibrous.run(function() {
			if (message.event == 'synchronize') {
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

				application.logger.log('warn', 'factory synchronize', helper.cleanObjectIds(message));
			} else {
				self.handleEvent(message.event, message.message);
			}
		});
	});
}

/**
 * Handles incoming factory events, events are expected to come in the following format:
 *
 * [ '52d3fc718132f8486dcde1d0', 'privmsg' ] { nickname: 'ricki-',
 * 		username: 'ia1',
 * 		hostname: '127.0.0.1',
 * 		target: '#ircanywhere-test',
 * 		message: '#ircanywhere-test WORD UP BROSEPTH',
 * 		time: '2014-01-22T18:20:57.323Z',
 * 		raw: ':ricki-!ia1@84.19.104.162 PRIVMSG #ircanywhere-test :#ircanywhere-test here is a test' }
 *
 * More advanced docs can be found at https://github.com/ircanywhere/irc-factory/wiki/Events
 *
 * @method 	handleEvent
 * @param 	{Array} event
 * @param 	{Object} object
 * @extend 	false
 * @return 	void
 */
IRCFactory.prototype.handleEvent = function(event, object) {
	var key = event[0],
		e = event[1],
		client = Clients[key];

	if (_.isFunction(ircHandler[e])) {
		fibrous.run(function() {
			ircHandler[e].call(ircHandler, client, object);
		});
	}
	
	console.log(event, object);
}

/**
 * Sends the command to create a new irc client with the given settings
 *
 * @method 	create
 * @param 	{Object} network
 * @extend 	false
 * @return 	void
 */
IRCFactory.prototype.create = function(network) {
	var key = network._id.toString();
	// generate a key, we just use the network id because it's unique per network
	// and doesn't need to be linked to a client, saves us hashing keys all the time

	networkManager.changeStatus({_id: key}, networkManager.flags.connecting);
	// mark the network as connecting

	this.rpc.emit('createClient', key, network);
	application.logger.log('info', 'creating irc client', helper.cleanObjectIds(Clients[key]));
},

/**
 * Sends the command to destroy a client with the given key
 * 
 * @method 	destroy
 * @param 	{ObjectID} key
 * @extend 	false
 * @return 	void
 */
IRCFactory.prototype.destroy = function(key) {
	application.logger.log('info', 'destroying irc client', helper.cleanObjectIds(Clients[key]));
	// log it before we destroy it below

	this.rpc.emit('destroyClient', key.toString());
},

/**
 * Calls an RPC command on the irc-factory client, usually used to send
 * commands such as /WHO etc. It's probably best to use CommandManager in most cases
 *
 * @method 	send
 * @param 	{ObjectID} key
 * @param 	{String} command
 * @param 	{Array} args
 * @extend 	false
 * @return	void
 */
IRCFactory.prototype.send = function(key, command, args) {
	this.rpc.emit('call', key.toString(), command, args);
}

exports.IRCFactory = IRCFactory;