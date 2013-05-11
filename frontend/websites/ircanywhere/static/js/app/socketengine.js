SocketEngine = Backbone.Model.extend({

	socket: null,
	endpoint: null,
	account: '',
	session_id: '',
	settings: {},
	forceDisconnect: false,
	disconnectReason: '',

	initialize: function(options)
	{
		this.listBuffer = {};
	},

	connect: function(data, connect)
	{
		var connect = connect || true;

		if (data != null)
		{
			this.endpoint = data.endpoint;
			this.account = data.username;
			this.session_id = data.session_id;
			this.settings = data.settings;

			if (data.settings !== undefined && typeof data.settings == 'object')
			{
				data.settings.timestamp_format = data.settings.timestamp_format || 0;
				
				$('div.mcontainer div.row').each(function()
				{
					var me = $(this),
						type = (data.settings.timestamp_format == 0) ? me.find('span.time').attr('data-format-1') : me.find('span.time').attr('data-format-2');

					me.find('span.time').text(type);
				});
			}
			// check some settings data
		}
		// set our variables

		if (connect && !connected)
		{
			if (this.endpoint == null)
				this.onClose();
			// node is offline

			this.socket = io.connect(this.endpoint, {
				'secure': true,
				'port': 443,
				'reconnect': false,
				'auto connect': true,
				'force new connection': true
			});
			// open the socket

			this.socket.on('connect', this.onOpen.bind(this));
			this.socket.on('data', this.onData.bind(this));
			this.socket.on('userlist', this.onUserList);
			this.socket.on('userinfo', this.onUserInfo);
			this.socket.on('networks', this.onNetworks);
			this.socket.on('channelUpdate', this.onChannelUpdate);
			this.socket.on('error', this.onError);
			this.socket.on('disconnect', this.onClose);
			this.socket.on('reconnect_failed', this.onReconnectFailed);
			this.socket.on('changeTab', this.onChangeTab);
			this.socket.on('updateNetwork', this.onUpdateNetwork);
			this.socket.on('addNetwork', this.onAddNetwork);
			this.socket.on('networkStatus', this.onNetworkStatus);
			this.socket.on('backlog', this.onBackLog.bind(this));
			this.socket.on('chanlistStart', this.onChanListStart.bind(this));
			this.socket.on('chanlist', this.onChanList.bind(this));
			this.socket.on('whois', this.onWhois.bind(this));
			// attach the event handlers
		}
		// connect to the node
	},

	onOpen: function()
	{
		$('div#login-box').empty().remove();
		$('div#sidebar').height($(document).height() - ($('div.sidebar div.header').outerHeight() + $('div.sidebar div#footer').outerHeight())).empty().html('<div class="content overthrow"><div id="network" class="network"></div></div>');
		$('div#channel-window-data, div#userlist').empty();
		$('label#nick-button').empty();
		$('div#not-connected, ul#home-menu, div#home-content').hide();
		$('div#sidebar-header, ul#options-menu, div#add-network').show();
		// clear any previous data

		client.socket.emit('login', {account: this.account, session_id: this.session_id, user_agent: navigator.userAgent});
		connected = true;
		// login
	},

	onData: function(data, options)
	{
		this.data(data, {
			modify: true,
			prepend: false,
			divider: false
		});
	},

	data: function(data, options)
	{
		data.command = data.command.toUpperCase();
		data.network = data.network;
		data.prepend = options.prepend || false;
		data.last = options.last || false;

		switch (data.command)
		{
			case 'PRIVMSG':
				parser.message(data);
				break;
			case 'NOTICE':
				parser.notice(data);
				break;
			case 'JOIN':
				eventHandler.join(data, options.modify);
				break;
			case 'PART':
				eventHandler.part(data, options.modify);
				break;
			case 'QUIT':
				eventHandler.quit(data, options.modify);
				break;
			case 'NICK':
				eventHandler.nick(data, options.modify);
				break;
			case 'MODE':
				eventHandler.mode(data);
				break;
			case 'KICK':
				eventHandler.kick(data, options.modify);
				break;
			case 'AWAY':
				eventHandler.away(data);
				break;
			case 'RPL_TOPIC':
				eventHandler.topic(data, options.modify);
				break;
			case 'RPL_CHANNELMODEIS':
				eventHandler.mode(data);
				break;
			case 'RPL_LINKS':
				eventHandler.links(data);
				break;
			case 'RPL_ENDOFLINKS':
				eventHandler.linksEnd(data);
				break;
			case '333':
				eventHandler.topic(data, options.modify);
				break;
			case 'TOPIC':
				eventHandler.topic(data, options.modify);
				break;
			case 'RPL_MOTDSTART':
				eventHandler.motdStart(data);
				break;
			case 'RPL_MOTD':
				eventHandler.motd(data);
				break;
			case 'RPL_ENDOFMOTD':
				eventHandler.motdEnd(data);
				break;
			case '005':
				eventHandler.numeric(data);
				break;
			case 'INVITE':
				eventHandler.invite(data);
				break;
			case 'RPL_INVITING':
				eventHandler.invited(data);
				break;
			case '328':
				parser.other(mem[data.network + '-chan-' + data.args[1].toLowerCase().substr(1)], '', IRCParser.exec(data.args[2], userInfo.networks[data.network]), 'event', data);
				break;
			case 'RPL_NAMREPLY':
				//parser.other(mem[data.network + '-chan-' + data.args[2].substr(1).toLowerCase()], data.args[2].substr(1), 'Users on ' + data.args[2].substr(1) + ': ' + data.args.slice(3).join(' '), 'event', data);
				break;
			// --- ignore
			case 'PING':
				break;
			case 'PONG':
				break;
			case 'RPL_ENDOFWHO':
				break;
			case 'RPL_NOTOPIC':
				break;
			case 'RPL_ENDOFNAMES':
				break;
			case 'ERR_NOTONCHANNEL':
				break;
			case 'CAP':
				break;
			case 'AUTHENTICATE':
				break;
			case '329':
				break;
			// --- ignore
			// --- custom commands / errors
			case 'ERROR':
				eventHandler.error(data);
				break;
			case 'ERR_NICKNAMEINUSE':
				actions.nickNameInUse(data.network, mem[data.network + '-window'], data);
				break;
			case 'DISCONNECT_BANNER':
				actions.windowConnectState(data.network, mem[data.network + '-window'], 'disconnected', true, data);
				break;
			case 'CONNECT_BANNER':
				actions.windowConnectState(data.network, mem[data.network + '-window'], 'connected', true, data);
				break;
			case 'CONNECTING_BANNER':
				actions.windowConnectState(data.network, mem[data.network + '-window'], 'connecting', true, data);
				break;
			// --- custom commands / errors
			default:
				parser.other(mem[data.network + '-window'], '', data.args.slice(1).join(' '), 'event', data);
				break;
		}
		// parse IRCDATA
	},

	onError: function(data, fn)
	{
		if (data.error_type == 'WS_CLOSE')
		{
			this.forceDisconnect = true;
			this.disconnectReason = data.error;
			fn('recieved');
		}
		// websocket has been forcefully closed from the backend
		else if (data.error_type == 'ADD' || data.error_type == 'UPDATE')
		{
			//$('div#edit-warning').hide();
			$('div#connect-error').empty().html('<ul></ul>').show();
			for (var msg in data.error)
				$('div#connect-error ul').append('<li>' + data.error[msg] + '</li>');
		}
		// add / update network form errors
		else if (data.error_type == 'CONNECT' || data.error_type == 'DISCONNECT')
		{
			parser.windowNotice(mem[data.network + '-window'], data.error, false);
		}
		// connect / disconnect event errors
		else if (data.error_type == 'GETCHANLIST')
		{
			eventHandler.listError(data.network, data.error);
		}
		// channel list cant be retrieved, usually too big.

		console.log(data);
	},

	onUserList: function(data)
	{
		eventHandler.who(data.network, data.chan.toLowerCase(), data.list);
	},

	onUserInfo: function(data)
	{
		userInfoParser.incoming(data);
	},

	onNetworks: function(data)
	{
		userInfoParser.networks(data);
	},

	onChannelUpdate: function(data)
	{
		var tabId = mem[data.network + '-chan-' + data.chan.substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);

		eventHandler.handleTopic(tab, data);
		eventHandler.handleMode(tab, data);
		eventHandler.handleUsers(tab, data);
		// handle all these commands individually for ease
	},

	onAddNetwork: function(data)
	{
		if (data.success)
		{
			window.location.hash = '#!/';
			userInfoParser.addNetwork(data.netName, data.network, true, function ()
			{
				var tabId = mem[data.netName + '-window'];
				
				actions.selectTab(tabId);
				actions.windowConnectState(data.netName, tabId, 'disconnected', true, false);
			});
		}
	},

	onChangeTab: function(data)
	{
		var tabId = mem[data.tab];

		if (tabId != undefined)
			actions.selectTab(tabId);
	},

	onUpdateNetwork: function(data)
	{
		window.location.hash = '#!/';
		userInfoParser.addNetwork(data.netName, data.network, false, function()
		{
			var tabId = mem[data.netName + '-window'];
			actions.selectTab(tabId);
			actions.windowConnectState(data.netName, tabId, 'disconnected', true, false);
			parser.windowNotice(tabId, 'Your settings for ' + userInfo.networks[network].name + ' have been updated.', false);
		});
	},

	onNetworkStatus: function(data)
	{
		var tab = tabCollections.getByCid(mem[data.network + '-window']);
			tab.set({finishedPlayback: true, prependHTML: ''});

		userInfo.networks[data.network].status = data.status;
		// change the status here
		
		actions.windowConnectState(data.network, tab.cid, data.status, true, false);
		// handle the status change here
	},

	finishPlayback: function(data, tab, topEventId)
	{
		if (data == undefined || tab == undefined) return;

		var lastTime = tab.get('lastTimeP'),
			markup = $.dateTimeBar(tab, lastTime, true, true);

		tab.set({toUnreadId: data.firstUnread, scrollLock: false});
		// tab settings

		var lastElement = tab.$msgs.find('div.mcontainer div.row[data-id=' + topEventId + ']'),
			scrollPosition = (lastElement[0] != undefined) ? lastElement[0].offsetTop : 0,
			status = userInfo.networks[data.network].status;
		// get the scroll position
		
		tab.defaultMessageBar(data.unreadMessages, data.highlightCount);
		tab.scrollHandler();
		// setup message bar

		tab.get('view').cleanup(true, true, scrollPosition);
		// cleanup the interface and scroll

		if (tab.get('type') == 'window')
			actions.windowConnectState(data.network, mem[data.network + '-window'], status, true, false);
		// perform some actions now
	},
	
	onBackLog: function(data)
	{
		if (data.url == undefined)
			return;

		$.get(this.endpoint + data.url, function(data)
		{
			var queryUsers = (data.status) ? data.unreadPrivmsgs : [],
				playBackCheck = null,
				topDivId = '0';

			if (data.status && queryUsers.length > 0)
			{
				for (var user in queryUsers)
				{
					var tId = mem[data.network + '-query-' + queryUsers[user].toLowerCase()];
					// get tab id and stuff

					if (tabCollections.getByCid(tId) == undefined)
						tId = actions.createWindow(data.network, queryUsers[user], 'query');
					// if the tab is undefined create the window, this will request the logs
				}
				// loop through the users we have messages from
			}
			// we need to figure out what to do with our queryUsers array

			if (!data.status)
			{
				var delimiter = (Helper.isChannel(userInfo.networks[data.network], data.target)) ? 'chan' : 'query',
					target = (delimiter == 'chan') ? data.target.toLowerCase().substr(1) : data.target.toLowerCase(),
					tabId = mem[data.network + '-' + delimiter + '-' + target],
					tab = tabCollections.getByCid(tabId);
			}
			else
			{
				var tabId = mem[data.network + '-window'],
					tab = tabCollections.getByCid(tabId);	
				
				if (data.topId == null)
					data.messages.reverse();
			}

			if (data.messages.length == 0)
			{
				tab.set({playbackData: {data: data, topDivId: null}});
				tab.set({finishedPlayback: true, prependHTML: ''});
			}
			else
			{
				tab.set({finishedPlayback: false, prependHTML: ''});
			}

			for (var i = 0, l = data.messages.length; i < l; i++)
			{
				this.data(data.messages[i], {
					modify: false,
					prepend: true,
					last: ((data.messages.length - 1) == i) ? true : false
				});
				// handle the command

				if (i == 0 || (data.messages.length - 1) == i)
				{
					if (i == 0)
					{
						topDivId = tab.get('topEventId');
						if (i != (data.messages.length - 1))
							continue;
					}

					setTimeout(function() {
						tab.set({playbackData: {data: data, topDivId: topDivId}});
						tab.set({finishedPlayback: true, prependHTML: ''});
					}, 200);
				}
			}
			// execute this first

		}.bind(this), 'json');
	},

	onChanListStart: function(data)
	{
		this.listBuffer[data.network] = [];
		eventHandler.listStart(data.network);
		// start building the list
	},
	// this function is an indicator to tell the frontend that the backend
	// has started to retrieve lists. Reason for this is because when the list gets
	// large ish ~ 1000 or so channels there is a slight wait.

	onChanList: function(data)
	{
		var odata = data;
		if (odata.url == undefined)
			return;

		$.get(this.endpoint + odata.url, function(data)
		{
			if (this.listBuffer[data.network] == undefined || mem[data.network + '-other-list'] == undefined)
				this.onChanListStart(odata).bind(this);
			// check if the tab is still open, theoretically it should be
			// but some idiot might have closed it thinking it was taking too long.

			for (var i = 0, l = data.channels.length; i < l; i++)
				this.listBuffer[data.network].push(data.channels[i]);
			// loop through the lists

			if (this.listBuffer[data.network] != undefined)
				eventHandler.listEnd(data.network, this.listBuffer[data.network]);
			this.listBuffer[data.network].length = 0;
			// done finish building the list

		}.bind(this), 'json');
	},

	onWhois: function(data)
	{
		eventHandler.whois(data);
	},
	// handle whois data

	onClose: function(reason)
	{
		connected = false;
		countdownFrom = currentSecond = 31;
		// global variable

		if (this.forceDisconnect && reason == 'booted')
			var message = this.disconnectReason;
		else
			var message = 'IRCAnywhere is currently unable to connect at the moment, Please wait around, we will attempt to reconnect you in <span id="second-timer">' + countdownFrom + '</span> seconds.';
		// we've been forcefully disconnected. OH OHH

		function disconnect()
		{
			$('div#not-connected').empty().html('<h3>Oh-oh!</h3><p>' + message + '</p>');
			// change the error message

			$('div#sidebar').empty().height(0);
			$('div#login-box').empty().remove();
			$('div#channel-window-data, div#userlist').empty();
			$('div#home-content, div#channel-window-data, div#channel-input, div#sidebar-header, ul#options-menu, div#add-network').hide();
			$('div#not-connected').show();
			$('ul#home-menu').show();
			$('label#nick-button').empty();
			client.hideLoading();
			// lost connection? notify the user and try to reconnect soon.

			userInfo = {};
			netinfo = {};
			mem = {};
			selectedNet = null;
			selectedChan = null;
			selectedTab = null;
			tabCollections.reset();
			// reset some variables

			if (!this.forceDisconnect)
				countTimer();
			// should we attempt to reconnect?
		}

		function countTimer()
		{
			if (currentSecond != 0)
			{
				currentSecond--;
				$('span#second-timer').text(currentSecond);
			}
			else
			{
				countdownFrom = 31,
				currentSecond = countdownFrom;

				client.showLoading();
				setTimeout(executeInitJSON(), 1000);
				return;
			}

			setTimeout(countTimer, 1000);
			// change the second timer
		}

		setTimeout(disconnect.bind(this), 500);
	},

	onReconnectFailed: function()
	{
		client.showLoading();
		executeInitJSON();
		// attempt to start from the top again these changes scrap our own reconnect method and
		// use socket.io's it seems to be a bit more reliable and hopefully will fix the hanging
		// on nodejitsu, also fixes the hanging when the node is offline
	},

	onLoggedOut: function()
	{
		if (window.location.hash == '' || window.location.hash == '#' || window.location.hash == '#?/')
			window.location.hash = '#?/home';

		$('div#sidebar, div#channel-window-data, div#userlist').empty();
		$('div#channel-input, div#sidebar-header, ul#options-menu, div#add-network').hide();
		$('ul#home-menu, div#login-box, div#home-content').show();

		try {
			Backbone.history.start();
		} catch(e) {}
		// probably not started but we'll try anyway
	},

	showLoading: function()
	{
		$('div#loading').show();
		$('div#channel-input, div#channel-window-data, div#home-content, div#no-networks, div#not-connected').hide();
		return this;
	},
	// show loading page

	hideLoading: function()
	{
		$('div#loading').hide();
		return this;
	},
	// hide loading page

	showNoNetworks: function()
	{
		$('div#no-networks').show();
		$('div#channel-input, div#channel-window-data').hide();
		return this;
	},

	hideNoNetworks: function()
	{
		$('div#no-networks').hide();
		$('div#channel-input, div#channel-window-data').show();
		return this;
	}
});

var client = new SocketEngine();