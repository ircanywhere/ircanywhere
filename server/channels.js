/**
 * IRCAnywhere server/channels.js
 *
 * @title ChannelManager
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash'),
	hooks = require('hooks');

/**
 * This object is responsible for managing everything related to channel records, such as
 * the handling of joins/parts/mode changes/topic changes and such.
 * As always these functions are extendable and can be prevented or extended by using hooks.
 *
 * @class ChannelManager
 * @method ChannelManager
 * @return void
 */
function ChannelManager() {
	this.channel = {
		network: '',
		channel: '',
		topic: {},
		modes: ''
	};
	// a default channel object
}

/**
 * Gets a tab record from the parameters passed in, strictly speaking this doesn't have to
 * be a channel, a normal query window will also be returned. However this class doesn't
 * need to work with anything other than channels.
 *
 * A new object is created but not inserted into the database if the channel doesn't exist.
 *
 * @method getChannel
 * @param {String} network A network string such as 'freenode'
 * @param {String} channel The name of a channel **with** the hash key '#ircanywhere'
 * @return {Object} A channel object straight out of the database.
 */
ChannelManager.prototype.getChannel = function(network, channel) {
	var chan = application.Tabs.sync.findOne({network: network, target: channel});

	if (!chan) {
		var chan = _.clone(this.channel);
			chan.network = network;
			chan.channel = channel;
	}

	return chan;
}

/**
 * Inserts a user or an array of users into a channel record matching the network key
 * network name and channel name, with the option to force an overwrite
 * 
 * @method insertUsers
 * @param {ObjectID} key A valid Mongo ObjectID for the networks collection
 * @param {String} network The network name, such as 'freenode'
 * @param {String} channel The channel name '#ircanywhere'
 * @param {Array[Object]} users An array of valid user objects usually from a who/join output
 * @param {Boolean} [force] Optional boolean whether to overwrite the contents of the channelUsers
 * @return {Array} The final array of the users inserted
 */
ChannelManager.prototype.insertUsers = function(key, network, channel, users, force) {
	var force = force || false,
		channel = channel.toLowerCase(),
		burst = (users.length > 1) ? true : false,
		find = [],
		chan = this.getChannel(key, channel),
		finalArray = [];

	for (var uid in users) {
		var u = users[uid];

		u.network = network;
		u.channel = channel;
		u._burst = burst;
		find.push(u.nickname);

		if (u.nickname == Clients[key].nick) {
			application.Networks.sync.update({_id: key}, {$set: {hostname: u.hostname}});
		}
		// update hostname
	}
	// turn this into an array of nicknames

	if (force) {
		application.ChannelUsers.sync.remove({network: network, channel: channel});
	} else {
		application.ChannelUsers.sync.remove({network: network, channel: channel, nickname: {$in: find}});
	}
	// ok so here we've gotta remove any users in the channel already
	// and all of them if we're being told to force the update

	for (var uid in users) {
		var u = users[uid],
			prefix = eventManager.getPrefix(Clients[key], u);
		u.sort = prefix.sort;
		u.prefix = prefix.prefix;
		
		finalArray.push(u);
	}
	// send the update out

	if (finalArray.length > 0) {
		return application.ChannelUsers.sync.insert(finalArray);
	} else {
		return [];
	}
}

/**
 * Removes a specific user from a channel, if users is omitted, channel should be equal to a nickname
 * and that nickname will be removed from all channels records on that network.
 * 
 * @method removeUsers
 * @param {String} network A valid network name
 * @param {String} [channel] A valid channel name
 * @param {Array} users An array of users to remove from the network `or` channel
 * @return void
 */
ChannelManager.prototype.removeUsers = function(network, channel, users) {
	var channel = (_.isArray(channel)) ? channel : channel.toLowerCase(),
		users = (_.isArray(channel)) ? channel : users;
	// basically we check if channel is an array, if it is we're being told to
	// just remove the user from the entire network (on quits etc)

	if (users.length === 0) {
		return false;
	}

	if (_.isArray(channel)) {
		application.ChannelUsers.remove({network: network, nickname: {$in: users}}, {safe: false});
	} else {
		application.ChannelUsers.remove({network: network, channel: channel, nickname: {$in: users}}, {safe: false});
	}
	// send the update out
}

/**
 * Updates a user or an array of users from the specific channel with the values passed in.
 *
 * @method updateUsers
 * @param {ObjectID} key A valid Mongo ObjectID for the networks collection
 * @param {String} network The name of the network
 * @param {Array} users A valid users array
 * @param {Object} values A hash of keys and values to be replaced in the users array
 * @return void
 */
ChannelManager.prototype.updateUsers = function(key, network, users, values) {
	var update = {};

	for (var uid in users) {
		var u = users[uid],
			s = {network: network, nickname: u},
			records = application.ChannelUsers.sync.find(s).sync.toArray();

		for (var rid in records) {
			var user = records[rid];

			var updated = _.extend(user, values);
				updated.sort = eventManager.getPrefix(Clients[key], updated).sort;

			application.ChannelUsers.sync.update(s, _.omit(updated, '_id'));
			// update the record
		}
	}
	// this is hacky as hell I feel but it's getting done this way to
	// comply with all the other functions in this class
}

/**
 * Takes a mode string, parses it and handles any updates to any records relating to
 * the specific channel. This handles user updates and such, it shouldn't really be called
 * externally, however can be pre and post hooked like all other functions in this object.
 *
 * @method updateModes
 * @param {ObjectID} key A valid Mongo ObjectID for the networks collection
 * @param {Object} capab A valid capabilities object from the 'registered' event
 * @param {String} network Network name
 * @param {String} channel Channel name
 * @param {String} mode Mode string
 * @return void
 */
ChannelManager.prototype.updateModes = function(key, capab, network, channel, mode) {
	var channel = channel.toLowerCase(),
		chan = this.getChannel(key, channel),
		us = {};

	var users = application.ChannelUsers.sync.find({network: network, channel: channel}).sync.toArray(),
		parsedModes = modeParser.sortModes(capab, mode);
	// we're not arsed about the channel or network here

	var modes = modeParser.changeModes(capab, chan.modes, parsedModes);
	// we need to attempt to update the record now with the new info

	application.Tabs.update({network: key, target: channel}, {$set: {modes: modes}}, {safe: false});
	// update the record

	users.forEach(function(u) {
		delete u._id;
		us[u.nickname] = u;
	});

	modeParser.handleParams(capab, us, parsedModes).forEach(function(u) {
		var prefix = eventManager.getPrefix(Clients[key], u);
		u.sort = prefix.sort;
		u.prefix = prefix.prefix;
		
		application.ChannelUsers.update({network: network, channel: channel, nickname: u.nickname}, u, {safe: false});
	});
	// update users now
}

/**
 * Updates the specific channel's topic and setby in the internal records.
 *
 * @method updateTopic
 * @param {ObjectID} key A valid Mongo ObjectID for the networks collection
 * @param {String} channel A valid channel name
 * @param {String} topic The new topic
 * @param {String} setby A setter string, usually in the format of 'nickname!username@hostname'
 * @return void
 */
ChannelManager.prototype.updateTopic = function(key, channel, topic, setby) {
	var channel = channel.toLowerCase(),
		chan = this.getChannel(key, channel);

	var topic = {
		topic: topic,
		setter: setby || ''
	};
	// updat the topic record

	application.Tabs.update({network: key, target: channel}, {$set: {topic: topic}}, {safe: false});
	// update the record
}

exports.ChannelManager = _.extend(ChannelManager, hooks);