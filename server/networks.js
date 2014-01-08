NetworkManager = function() {
	"use strict";
	
	var hooks = Meteor.require('hooks');

	var Manager = {
		flags: {
			connected: 'connected',
			disconnected: 'disconnected',
			connecting: 'connecting',
			closed: 'closed',
			failed: 'failed'
		},

		init: function() {
			Meteor.publish('networks', function() {
				return Networks.find({'internal.userId': this.userId});
			});

			Meteor.publish('tabs', function() {
				return Tabs.find({user: this.userId});
			});

			Tabs.allow({
				update: function(userId, doc, fieldNames, modifier) {
					return ((_.difference(fieldNames, ['hiddenUsers']) == 0) ||
							(_.difference(fieldNames, ['hiddenEvents']) == 0));
				}
			});
			// setup allow rules for this collection

			var networks = Networks.find(),
				tabs = Tabs.find();

			networks.forEach(function(doc) {
				Clients[doc._id] = doc;
				Clients[doc._id].internal.tabs = {};
			});
			// XXX - This can be changed when the changes in release/oplog-operators
			//       get merged into the new release. Because of us requiring the new template
			//       engine this needs to be here as a fallback until the changes are core.

			networks.observe({
				added: function(doc) {
					if (!_.has(Clients, doc._id)) {
						Clients[doc._id] = doc;
						Clients[doc._id].internal.tabs = {};
					}
					// XXX - See above
				},

				changed: function(doc, old) {
					Clients[doc._id] = doc;
					Clients[doc._id].internal.tabs = {};
					Tabs.find({user: doc.internal.userId, network: doc._id}).forEach(function(tab) {
						Clients[doc._id].internal.tabs[tab.target] = tab;
					});
				},

				removed: function(doc) {
					delete Clients[doc._id];
				}
			});
			// just sync clients up to this, instead of manually doing it
			// we're asking for problems that way doing it this way means
			// this object will be identical to the network list

			tabs.observe({
				added: function(doc) {
					Clients[doc.network].internal.tabs[doc.target] = doc;
				},

				changed: function(doc, old) {
					Clients[doc.network].internal.tabs[doc.target] = doc;
				},

				removed: function(doc) {
					delete Clients[doc.network].internal.tabs[doc.target];
				}
			});
			// sync Tabs to client.internal.tabs so we can do quick lookups when entering events
			// instead of querying each time which is very inefficient
		},

		getClients: function() {
			var self = this,
				clients = {},
				networks = Networks.find();
			// get the networks (we just get all here so we can do more specific tests on whether to connect them)

			networks.forEach(function(network) {
				var me = Meteor.users.findOne({_id: network.internal.userId}),
					reconnect = false;

				if (network.internal.status !== self.flags.disconnected) {
					reconnect = true;
				}

				if (reconnect) {
					clients[network._id] = {user: me, network: network};
					// add the client into our local cache
				}
			});
			// here we just mark them for connection by passing them into this.reconnect

			return clients;
		},

		addNetwork: function(user, network) {
			var userCount = Meteor.users.find().count(),
				userName = application.config.clientSettings.userNamePrefix + userCount;

			network.name = network.server;
			network.nick = user.profile.nickname;
			network.user = userName;
			network.secure = network.secure || false;
			network.sasl = network.sasl || false;
			network.saslUsername = network.saslUsername || undefined;
			network.password = network.password || null;
			network.capab = true;
			// because some settings can be omitted, we're going to set them to
			// the hard-coded defaults if they are, ok. We don't need to worry about
			// validating them before hand either because app.js takes care of that.
			// XXX - this looks a bit messy, tidied up at some point? it would be nice
			//		 if simple-schema could automatically cast these, maybe it can with cast: {}

			network.internal = {
				nodeId: Meteor.nodeId,
				userId: user._id,
				status: this.flags.closed,
				tabs: {},
				url: network.server + ':' + ((network.secure) ? '+' : '') + network.port
			}
			// this stores internal information about the network, it will be available to
			// the client but they wont be able to edit it, it also wont be able to be enforced
			// by the config settings or network settings, it's overwritten every time.

			network._id = Networks.insert(network);
			// insert the network. Just doing this will propogate the change directly
			// down the pipe to our client @ this.userId, also by calling insert without
			// a callback meteor automatically sets up a fiber, blocking the code in users.js

			return network;
		},

		addTab: function(client, target, type, select) {
			var select = select || false,
				obj = {
					user: client.internal.userId,
					url: (type === 'network') ? client.internal.url : client.internal.url + '/' + target.toLowerCase(),
					network: client._id,
					target: target.toLowerCase(),
					title: target,
					type: type,
					selected: select,
					prevSelected: false,
					active: true
				};

			if (obj.target.trim() == '') {
				return false;
			}
			// empty, bolt it

			if (select) {
				Tabs.update({user: client.internal.userId, selected: true}, {$set: {selected: false, prevSelected: true}});
			}
			// are they requesting a new selected tab?

			var tab = Tabs.findOne({user: client.internal.userId, network: client._id, target: target});

			if (tab === undefined) {
				Tabs.insert(obj);
			} else {
				Tabs.update({user: client.internal.userId, network: client._id, target: target}, {$set: {active: true, selected: select}});
			}
			// insert to db, or update old record
		},

		activeTab: function(client, target, activate) {
			if (typeof target !== "boolean") {
				Tabs.update({user: client.internal.userId, network: client._id, target: target}, {$set: {active: activate}});
			} else {
				Tabs.update({user: client.internal.userId, network: client._id}, {$set: {active: target}}, {multi: true});
			}
			// update the activation flag
		},

		selectTab: function(url) {
			if (this.userId === null || url === '') {
				return false;
			}
			// no uid, bail

			var tab = Tabs.findOne({user: this.userId, url: url});

			if (tab !== undefined && !tab.selected) {
				Tabs.update({user: this.userId, prevSelected: true}, {$set: {prevSelected: false}});
				Tabs.update({user: this.userId, selected: true}, {$set: {selected: false, prevSelected: true}});
				Tabs.update({user: this.userId, url: url}, {$set: {selected: true}});
				// mark all as not selected apart from the one we've been told to select
			}
		},

		removeTab: function(client, target) {
			if (target) {
				Tabs.remove({user: client.internal.userId, network: client._id, target: target});
			} else {
				Tabs.remove({user: client.internal.userId, network: client._id});
			}
			// remove tabs

			Tabs.update({user: client.internal.userId, prevSelected: true}, {$set: {prevSelected: false, selected: true}});
			// re-select 
		},

		connectNetwork: function(user, network) {
			ircFactory.create(user, network);
		},

		changeStatus: function(networkId, status) {
			if (!(status in this.flags)) {
				application.logger.log('warn', 'invalid status flag', {flag: status, network: networkId});
				return;
			}

			var query = (typeof networkId === 'object') ? networkId : {_id: networkId};
			Networks.update(query, {$set: {'internal.status': status}});
		}
	};

	Meteor.methods({
		selectTab: Manager.selectTab
	});
	// expose some methods to the frontend

	Manager.init();

	return _.extend(Manager, hooks);
};