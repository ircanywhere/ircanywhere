EventHandler = Backbone.Model.extend({

	whoisData: [],
	
	topic: function(data, modify)
	{
		if (data.command == 'TOPIC')
		{
			var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
				tab = tabCollections.getByCid(tabId),
				chan = data.args[0],
				newArgs = data.args.slice();
				newArgs = newArgs.splice(1),
				user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
				userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false);
			
			parser.other(tabId, chan, '&ndash; ' + userLink + ' has changed the topic to: ' + IRCParser.exec(newArgs.join(' '), userInfo.networks[data.network]), 'topic', data);
		}
	},

	who: function(network, chan, data)
	{
		var tab = tabCollections.getByCid(mem[network + '-chan-' + chan.toLowerCase().substr(1)]),
			collection = tab.get('ulCollection');
			collection.reset();
		
		for (var user in data)
		{
			data[user].cid = mem[network + '-chan-' + chan.toLowerCase().substr(1)];
			data[user].network = network;
			collection.add([new UserModel(data[user])], {silent: true});
		}
		// find the @/+ etc and fire it in

		collection.render();
	},

	join: function(data, modify)
	{
		if (data.nick == userInfo.networks[data.network].nick && modify)
		{
			this.meJoin(data, modify);
		}
		else
		{
			this.otherJoin(data, modify);
		}
	},

	otherJoin: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);
		
		if (modify)
			tab.get('ulCollection').add([new UserModel({cid: tabId, network: data.network, user: data.nick, prefix: '', modes: '', away: false, hostname: data.prefix})], {silent: false});
	
		var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false);
		
		parser.other(tabId, data.args[0], '&rarr; ' + userLink + ' (' + data.prefix + ') has joined', 'join', data);
		// if *someone else* is joining a channel..
	},

	meJoin: function(data, modify)
	{
		var tabId = actions.createWindow(data.network, data.args[0], 'chan'),
			tab = tabCollections.getByCid(tabId);

		tab.$list.find('.left').text('Users');
		actions.selectTab(tabId);
		// if *we're* joining a channel.

		if (tab != undefined)
		{
			tab.set({disabled: false});
			
			var linkText = tab.$link.find('a span.link').text();
			if (linkText.substr(0, 1) == '(' && linkText.substr(linkText.length - 1, 1) == ')')
			{
				tab.$link.find('a span.link').text(data.args[0]);
				parser.other(tabId, data.args[0], '&rarr; You have joined', 'join', data);
				// let the user know we've rejoined the channel.
			}
			// mark network tab as connected by changing it to IRCNode
		}
		// disable the tab :3
	},

	part: function(data, modify)
	{
		if (data.nick == userInfo.networks[data.network].nick && modify)
		{
			this.mePart(data, modify);
		}
		else
		{
			this.otherPart(data, modify);
		}
		// handle parts
	},

	otherPart: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId),
			user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false),
			message = (data.args.length == 1) ? '' : data.args.splice(1).join(' ');

		parser.other(tabId, data.args[0], '&larr; ' + userLink + ' (' + data.prefix + ') has left: ' + message, 'part', data);
		
		if (modify)
		{
			var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; });
			
			if (user[0] != undefined)
				tab.get('ulCollection').remove(user[0], {silent: false});
		}
		// if *someone else* is parting a channel..
	},

	mePart: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);

		if (tab == undefined)
			return;
		
		tab.$link.find('a span.link').text('(' + data.args[0] + ')');
		tab.$list.find('.left, .right').empty();
		tab.$list.find('ul').empty();
		// make it clear we've parted.
		
		if (tabCollections.getByCid(tabId) != undefined)
			tabCollections.getByCid(tabId).set({disabled: true});
		// disable the tab :3
	},

	quit: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);

		if (tab == undefined)
			return;

		var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false),
			message = (data.args.length == 1) ? '' : data.args.splice(1).join(' ');

		parser.other(tab.cid, tab.get('name'), '&larr; ' + userLink + ' (' + data.prefix + ') has quit: ' + message, 'quit', data);
		
		if (user[0] != undefined && modify)
			tab.get('ulCollection').remove(user[0], {silent: false});
		// if someone is quitting
	},

	kick: function(data, modify)
	{
		if (modify && data.args[1] == userInfo.networks[data.network].nick)
		{
			this.meKick(data, modify);
		}
		else
		{
			this.otherKick(data, modify);
		}
		// handle kick
	},

	otherKick: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId),
			user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false),
			user2 = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.args[0]; }.bind(this)),
			userLink2 = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.args[0], 'unknown', 'unknown', '', false, false) : user2[0].userLink(false);
		
		parser.other(tabId, data.args[0], '&larr; ' + userLink + ' has kicked ' + userLink2 + ' (' + data.args[2] + ')', 'kick', data);
		
		if (modify)
		{
			var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.args[1]; });
			
			if (user[0] != undefined)
				tab.get('ulCollection').remove(user[0], {silent: false});
		}
		// if *someone else* is being kicked from a channel..
	},

	meKick: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);
	
		tab.$link.find('a span.link').text('(' + data.args[0] + ')');
		// make it clear we've been kicked.
		
		tab.set({disabled: true});
		// disable the tab :3
	},

	nick: function(data, modify)
	{
		// not worth splitting this function up into meNick and otherNick
		// as they are basically performing identical tasks
		// TODO - Look into the user button at the bottom not changing on nick change

		if (data.args[0].indexOf(' ') > -1)
			data.args = data.args[0].split(' ');

		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId),
			user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }),
			network = tab.get('network');
		
		if (user[0] != undefined && modify)
		{
			var prefix = user[0].get('prefix'),
				away = user[0].get('away'),
				hostname = user[0].get('hostname'),
				modes = user[0].get('modes');

			tab.get('ulCollection').remove(user[0], {silent: false});
			tab.get('ulCollection').add([new UserModel({cid: tab.get('id'), network: network, user: data.args[1], prefix: prefix, modes: modes, away: away, hostname: hostname})], {silent: false});
			// update the userlist
		}

		if (data.args[1] == userInfo.networks[network].nick)
		{
			parser.other(tab.get('id'), tab.get('name'), '&ndash; You are now known as ' + data.args[1], 'nick', data);
			
			if (modify)
			{
				userInfo.networks[network].nick = data.args[1];
				if (network == selectedNet)
					$('label#nick-button').text(data.args[1]);
			}
		}
		else
		{
			var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.args[1]; }.bind(this)),
				userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.args[1], data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false);
				
			parser.other(tab.get('id'), tab.get('name'), '&ndash; ' + data.nick + ' is now known as ' + userLink, 'nick', data);
		}
		// show it in the channels
	},
	
	mode: function(data)
	{
		if (data.command == 'RPL_CHANNELMODEIS')
			return;

		var network = userInfo.networks[data.network],
			target = data.args[0],
			tabId = (Helper.isChannel(network, target)) ? mem[data.network + '-chan-' + target.toLowerCase().substr(1)] : mem[data.network + '-window'],
			tab = tabCollections.getByCid(tabId),
			tabName = (tab.get('name') == undefined) ? '' : tab.get('name'),
			user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false),
			newModes = (Helper.isChannel(network, target)) ? data.args.slice(1) : data.args;
			newModes = newModes.join(' ');
		
		parser.other(tabId, tabName, '&ndash; ' + userLink + ' sets ' + newModes, 'mode', data);
		// handle MODE
	},

	handleTopic: function(tab, data)
	{
		tab.set({topic: data.topic});
		tabCollections.resetTopicBar(tab);
		// reset the topic bar with the new topic
	},

	handleMode: function(tab, data)
	{
		tab.set({modes: '+' + data.modes});
		tabCollections.resetTopicBar(tab);
		// reset the topic bar with the new mode
	},

	handleUsers: function(tab, data)
	{
		for (var n in data.users)
		{
			var record = data.users[n],
				user = tab.get('ulCollection').filter(function(model) { return model.get('user') == record.user; });

			if (user[0] == undefined)
				return;
			// get the user and do some checking

			tab.get('ulCollection').remove(user[0], {silent: false});
			tab.get('ulCollection').add([new UserModel({cid: tab.get('id'), network: data.network, user: record.user, prefix: record.prefix, modes: record.modes, away: record.away, hostname: record.hostname})], {silent: false});
			// update the userlist
		}
		// loop through the changed users
	},

	away: function(data)
	{
		tabCollections.each(function(tab)
		{
			if (tab.get('network') != data.network)
				return;
			
			var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }),
				away = (data.args[0] == undefined || data.args[0] == '' || data.args[0] == ':') ? false : true;

			user.set({away: away});
		});
		// for each channel that the nick is in handle it
	},

	listError: function(network, error)
	{
		var tabId = mem[network + '-other-list'];
		
		if (tabId == undefined)
		{
			var tabId = actions.createWindow(network, '/list', 'other'),
				tab = tabCollections.getByCid(tabId);
		}
		// create a new tab

		actions.selectTab(tabId);
		// select the tab

		tab.$table.empty().append('<thead><tr class="heading"><th>Channel</th><th>Users</th><th>Topic</th></tr></thead><tbody><tr><td colspan="3">' + error + '</td></tr></tbody>');
		tab.$link.find('a:first span.link').removeClass('net-loader').addClass('net-loaded');
		// if the table is empty, add a heading row
	},

	listStart: function(network)
	{
		var tabId = mem[network + '-other-list'];
		
		if (tabId == undefined)
		{
			var tabId = actions.createWindow(network, '/list', 'other'),
				tab = tabCollections.getByCid(tabId);
		}
		// create a new tab

		actions.selectTab(tabId);
		// select the tab

		tab.$table.empty().append('<thead><tr class="heading"><th>Channel</th><th>Users</th><th>Topic</th></tr></thead><tbody></tbody>');
		// if the table is empty, add a heading row
	},

	listEnd: function(network, buffer)
	{
		var tabId = mem[network + '-other-list'],
			tab = tabCollections.getByCid(tabId),
			list = new BufferListView({tabId: tabId, network: network, list: buffer});

		list = null;
		
		tab.$link.find('a:first span.link').removeClass('net-loader').addClass('net-loaded');
		tab.$table.tablesorter();
		// tell it to happen soon, as tablesorter errors for some reason
	},

	links: function(data)
	{
		parser.other(mem[data.network + '-other-links'], 'links', data.args.join(' '), 'other', data);
	},

	linksEnd: function(data)
	{
		var tabId = mem[data.network + '-other-links'],
			tab = tabCollections.getByCid(tabId);

		tab.$link.find('a:first span.link').removeClass('net-loader').addClass('net-loaded');
		tab.$table.tablesorter();
		// change some css and do the tablesorter.
	},

	motdStart: function(data)
	{
		parser.other(mem[data.network + '-window'], '', IRCParser.exec(data.args[1], userInfo.networks[data.network]), 'motd', data);
	},

	motd: function(data)
	{
		parser.other(mem[data.network + '-window'], '', IRCParser.exec(data.args[1], userInfo.networks[data.network]), 'motd', data);
	},

	motdEnd: function(data)
	{
		var tabId = mem[data.network + '-window'],
			tab = tabCollections.getByCid(tabId);

		tab.$msgs.scrollTop(tab.$msgs.find('.content').height());
	},

	numeric: function(data)
	{
		var tabId = mem[data.network + '-window'];
		parser.other(tabId, '', data.args.slice(1).join(' '), 'event', data);
	},

	error: function(data)
	{
		var tabId = mem[data.network + '-window'];
		parser.windowNotice(tabId, data.args.join(' '), false);
		actions.windowConnectState(data.network, tabId, 'closed', true, false);
	},

	invite: function(data)
	{
		var string = IRCParser.exec('You have been invited to ' + data.args[1] + ' by ' + data.args[0], userInfo.networks[selectedNet]);
		parser.other(selectedTab, '', string, 'event', data);
	},

	inviting: function(data)
	{
		var string = IRCParser.exec('You have invited ' + data.args[1] + ' to ' + data.args[2], userInfo.networks[selectedNet]);
		parser.other(selectedTab, '', string, 'event', data);
	},

	whois: function(data)
	{
		var whoisData = [],
			whoisView = new BufferWhoisView({network: data.network, user: data.nick});

		whoisData.push('(' + data.nick + '!' + data.info.user + '@' + data.info.host + '): ' + data.info.realname);
		
		if (data.info.channels != undefined)
			whoisData.push(IRCParser.exec(data.info.channels.join(' '), userInfo.networks[data.network]));

		whoisData.push(data.info.server + ': ' + data.info.serverinfo);
		// start constructing our whois data

		delete data.info.user;
		delete data.info.nick;
		delete data.info.host;
		delete data.info.realname;
		delete data.info.channels;
		delete data.info.server;
		delete data.info.serverinfo;
		// remove already used info

		for (var line in data.info)
			whoisData.push(data.info[line]);

		whoisView.render(whoisData);
		whoisView = null;
	}
});

var eventHandler = new EventHandler();