var _ = require('lodash'),
	hooks = require('hooks');

/**
 * This object is responsible for managing everything related to channel records, such as
 * the handling of joins/parts/mode changes/topic changes and such.
 * As always these functions are extendable and can be prevented or extended by using hooks.
 *
 * @class ChannelManager
 * @method ChannelManager
 * @extend false
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
 * Gets a tab record from the passed in network and channel, this is not specific to users
 *
 * @method getChannel
 * @param {String} network
 * @param {String} channel
 * @extend true
 * @return {Object} tab object
 */
ChannelManager.prototype.getChannel = function(network, channel) {
	var chan = application.Tabs.sync.findOne({network: network, title: channel});

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
 * @param {ObjectID} key
 * @param {String} network
 * @param {String} channel
 * @param {Array} users
 * @param {Boolean} force
 * @extend true
 * @return {Array} array of the users inserted
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

	return application.ChannelUsers.sync.insert(finalArray);
}

/**
 * Removes a specific user from a channel, if users is omitted, channel should be equal to a nickname
 * and that nickname will be removed from all channels records on that network
 * 
 * @method removeUsers
 * @param {String} network
 * @param {String} channel
 * @param {Array} [optional] users
 * @extend true
 * @return void
 */
ChannelManager.prototype.removeUsers = function(network, channel, users) {
	var channel = (_.isArray(channel)) ? channel : channel.toLowerCase(),
		users = (_.isArray(channel)) ? channel : users;
	// basically we check if channel is an array, if it is we're being told to
	// just remove the user from the entire network (on quits etc)

	if (_.isArray(channel)) {
		application.ChannelUsers.sync.remove({network: network, nickname: {$in: users}});
	} else {
		application.ChannelUsers.sync.remove({network: network, channel: channel, nickname: {$in: users}});
		// update
	}
	// send the update out
}

/**
 * Updates a user or an array of users from the specific channel with the values passed in
 *
 * @method updateUsers
 * @param {ObjectID} key
 * @param {String} network
 * @param {Array} users
 * @param {Object} values
 * @extend true
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
 * @param {ObjectID} key
 * @param {Object} capab
 * @param {String} network
 * @param {String} channel
 * @param {String} mode
 * @extend true
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

	application.Tabs.sync.update({network: key, title: channel}, {$set: {modes: modes}});
	// update the record

	users.forEach(function(u) {
		delete u._id;
		us[u.nickname] = u;
	});

	modeParser.handleParams(capab, us, parsedModes).forEach(function(u) {
		var prefix = eventManager.getPrefix(Clients[key], u);
		u.sort = prefix.sort;
		u.prefix = prefix.prefix;
		
		application.ChannelUsers.sync.update({network: network, channel: channel, nickname: u.nickname}, u);
	});
	// update users now
}

/**
 * Updates the specific channel's topic and setby in the internal records
 *
 * @method updateTopic
 * @param {ObjectID} key
 * @param {String} channel
 * @param {String} topic
 * @param {String} setby
 * @extend true
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

	application.Tabs.sync.update({network: key, title: channel}, {$set: {topic: topic}});
	// update the record
}

exports.ChannelManager = _.extend(ChannelManager, hooks);