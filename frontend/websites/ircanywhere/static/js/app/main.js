$.escape = function(text) { 
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/*
 * $.serializeObject()
 *
 * Basically the same as $.serializeArray(), however, returns an object
 */
$.fn.serializeObject = function()
{
	var o = {};
	$.each(this.serializeArray(), function()
	{
		if (o[this.name] !== undefined)
		{
			if (!o[this.name].push)
				o[this.name] = [o[this.name]];
			o[this.name].push(this.value || '');
		}
		else
		{
			o[this.name] = this.value || '';
		}
	});
	return o;
};

/*
 * $.reset()
 *
 * Resets a form
 */
$.fn.reset = function ()
{
	$(this).each(function()
	{
		if ($(this).attr('type') != 'submit' || $(this).attr('type') != 'button')
			this.reset();
	});
};

/*
 * $.fastEncode()
 *
 * Function used to encode nicknames
 */
$.fastEncode = function(str)
{
	var hash = 0;
	if (str.length == 0) return hash;
	for (i = 0; i < str.length; i++)
	{
		hash = ((hash << 5) - hash) + str.charCodeAt(i);
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
};

/*
 * $.isAtBottom()
 *
 * Function to determine if div is at the bottom.
 */
$.fn.isAtBottom = function()
{
	var inner = $(this).find('div.mcontainer'),
		row = inner.children('div.row:last-child');

	return ($(this)[0].scrollHeight - $(this).scrollTop() - $(this).outerHeight() - row.height() == 0);
};

/*
 * $.parse(network, inputText)
 *
 * Parse everything that gets outputted to the channel window, bold tags, links, etc.
 */
$.parse = function(network, inputText)
{
	if (inputText == undefined) return;

	return IRCParser.exec(inputText, userInfo.networks[network]);
};

/*
 * $.generateTime(time, extended)
 *
 * Generate a fancy timestamp, like 13:46 PM
 */
$.generateTime = function(time, extended)
{
	if (time == undefined)
		time = new Date();
	
	var ap = 'AM',
		now = new Date(time),
		hour = now.getHours(),
		minute = now.getMinutes();
		minute = (minute < 10) ? '0' + minute : minute,
		day = now.getDate(),
		day = (day < 10) ? '0' + day : day,
		month = now.getUTCMonth() + 1,
		month = (month < 10) ? '0' + month : month,
		year = now.getUTCFullYear();

	if (hour > 11) ap = 'PM';
	if (hour > 12) hour = hour - 12;
	if (hour == 0) hour = 12;
	
	if (extended)
		return day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ' ' + ap;
	else
		return hour + ':' + minute + ' ' + ap;
};

$.generateTimestamp = function(time)
{
	if (time == undefined)
		time = new Date();
	
	var now = new Date(time),
		hour = now.getHours();
		hour = (hour < 10) ? '0' + hour : hour;
		minute = now.getMinutes();
		minute = (minute < 10) ? '0' + minute : minute;
		seconds = now.getSeconds();
		seconds = (seconds < 10) ? '0' + seconds : seconds;
	
	return hour + ':' + minute + ':' + seconds;
};

/*
 * $.generateAltTime(secs)
 *
 * Generate a a 00:00:00 from a number of seconds
 */
$.generateAltTime = function(secs)
{
	var hours = Math.floor(secs / (60 * 60)),
		hours = (hours.toString().length == 1) ? '0' + hours : hours,
		divisorForMinutes = secs % (60 * 60),
		minutes = Math.floor(divisorForMinutes / 60),
		minutes = (minutes.toString().length == 1) ? '0' + minutes : minutes,
		divisorForSeconds = divisorForMinutes % 60,
		seconds = Math.ceil(divisorForSeconds),
		seconds = (seconds.toString().length == 1) ? '0' + seconds : seconds;
   
	return hours + ':' + minutes + ':' + seconds;
};

/*
 * $.dateTimeBar()
 *
 * Determine if a date divider should be inserted, if so return the html
 */
$.dateTimeBar = function(tab, time, prepend, force)
{
	var force = force || false,
		timeDate = time.getDate() + '/' + time.getMonth() + '/' + time.getFullYear(),
		rTimeDate = tab.get('lastTime').getDate() + '/' + tab.get('lastTime').getMonth() + '/' + tab.get('lastTime').getFullYear(),
		rpTimeDate = tab.get('lastTimeP').getDate() + '/' + tab.get('lastTimeP').getMonth() + '/' + tab.get('lastTimeP').getFullYear(),
		newDate = new Date(time);
  
	if (!force)
	{
		if (prepend)
		{
			if (timeDate != rpTimeDate)
				tab.set({lastTimeP: time});
			else
				return null;
		}
		else
		{
			if (timeDate != rTimeDate)
				tab.set({lastTime: time});
			else
				return null;
		}
	}
	// we're not forcing it so it doesn't matter

	var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		date = dayNames[newDate.getDay()] + ', ' + newDate.getDate() + ' ' + monthNames[newDate.getMonth()] + ' ' + newDate.getFullYear(),
		prevSelector = tab.$msgs.find('div.mcontainer div.row[data-type=date-divider]:last');

	var markup = $.tmpl('dividerRow', {
		type: 'date-divider',
		message: date
	});

	if (!force && prevSelector.length != 0 && prevSelector.html() == markup.html())
		return null;
	// this is a failsafe measure (although we're not able to completely rely on it unfortunately)
	// this also removes duplicates from query windows

	return markup;
};

/*
 * $.findNetworkFromId(id)
 *
 * Find network data from id (irc.soandso.net:6667)..
 */
$.findNetworkFromId = function(id)
{
	for (network in userInfo.networks)
	{
		if (userInfo.networks[network].url == id)
			return network;
	}

	return false;
};

var main = {},
	mem = {},
	netinfo = {},
	actions = {},
	userInfo = {},
	cookieData = {},
	editNet = null,
	selectedNet = null,
	selectedChan = null,
	selectedTab = null,
	fullContentWidth = 0,
	height = 0,
	tabHeight = 0,
	borderPadding = 2,
	dblBorderPadding = borderPadding * 2,
	listPadding = 6,
	largePadding = 20,
	inputPadding = 46,
	messageWidth = 0,
	userListWidth = 170,
	maxMsgCount = 250,
	previousHashes = [],
	connected = false,
	loggedIn = true;
	// set some global variables up

	window.isActive = true;

	Templates.preDefine();
	IRCParser.initialise();
	// initialise our parser

/*
 * document.ready
 *
 * Everything that is executed when the DOM is ready is inside here
 */
$(window).load(function()
{
	/*
	 * callInitJSON
	 *
	 * Callback function for $.getJSON('/init');
	 */
	callInitJSON = function(data)
	{
		if (data.logged_in && data.endpoint == null)
		{
			client.hideLoading();
			client.onClose(true);
		}
		// if node is unreachable
		else if (data.logged_in)
		{
			loggedIn = true;
			$('div#holder').show();
			client.connect(data);
		}
		// we're logged in, connect the client
		else
		{
			loggedIn = false;
			client.onLoggedOut();
			client.hideLoading();
		}
		// we're logged out, or the node information is bogus
	};

	/*
	 * updateInitJSON
	 *
	 * Callback function for $.getJSON('/init'), except don't connect
	 */
	updateInitJSON = function(data)
	{
		if (data.logged_in)
			client.connect(data, false);
		// we're logged in, update everything
	};

	/*
	 * executeInitJSON
	 *
	 * Execute callInitJSON with a try catch and error handler
	 */
	executeInitJSON = function()
	{
		try
		{
			$.getJSON('/init', callInitJSON);
			// run init to see if we're logged in or not.
		}
		catch (error)
		{
			client.hideLoading();
			client.onClose(true);
			// obviously failed to load resource
		}
	};

	executeInitJSON();
		
	/*
	 * notifier
	 *
	 * Notifier class 
	 */
	notifier = {

		api: null,
		stack: {},

		checkPermissions: function()
		{
			if (window.Notification)
				this.api = window.Notification;

			if (window.webkitNotifications)
				this.api = window.webkitNotifications;

			if (this.api == null)
				return false;

			return ((this.api == window.Notification && Notification.permissionLevel === 'granted') ||
					(this.api == window.webkitNotifications && window.webkitNotifications.checkPermission() == 0));
		},

		requestPermission: function()
		{
			if (this.api == window.Notification)
				Notification.requestPermission();

			if (this.api == window.webkitNotifications)
				window.webkitNotifications.requestPermission();
		},

		notify: function(id, network, chan, msg)
		{
			if (!notifier.checkPermissions())
				return null;
			// no permissions

			if (this.api == window.Notification)
				var notification = new Notification(userInfo.networks[network].name + ' / ' + chan, msg, {tag: id});
			else if (this.api == window.webkitNotifications)
				var notification = window.webkitNotifications.createNotification('', userInfo.networks[network].name + ' / ' + chan, msg);

			notification.show();
			notifier.stack[id] = notification;

			setTimeout(function() {
				var notification = notifier.stack[id];
					notification.cancel();

				notifier.stack[id] = null;
			}, 5000);
			// let's show the notification!
		}
	};

	/*
	 * actions
	 *
	 * Actions object that contains things like createWindow, selectTab, destroyWindow etc.
	 */
	actions = {

		/* 
		 * selectTab
		 * 
		 * change the selected tab
		 */
		selectTab: function(tabId)
		{
			if (window.location.hash.substr(1, 1) == '?')
				return;
			// bail incase we've got ? on the go
			
			$('div#home-content').hide();
			$('div#footer div.link').removeClass('selected');

			if (tabCollections.size() == 1)
				client.hideNoNetworks();

			if (selectedTab == tabId)
			{
				tabCollections.getByCid(tabId).get('view').hide();
				tabCollections.getByCid(tabId).get('view').show();
				return;
			}

			if (tabCollections.getByCid(selectedTab) != undefined)
				tabCollections.getByCid(selectedTab).get('view').hide();

			if (tabCollections.getByCid(tabId) != undefined)
			{
				tabCollections.getByCid(tabId).get('view').show();
				client.socket.emit('changeTab', {tab: tabCollections.getByCid(tabId).get('rId'), active: window.isActive});
				// send the current tab to the server (so we can remember what the last one was (Y))
			}
		},

		/* 
		 * createWindow
		 * 
		 * create a new tab
		 */
		createWindow: function(network, chan, type, extra)
		{
			var oNetwork = network,
				extra = extra || {},
				oChan = chan;

				network = network;
				chan = chan.toLowerCase();
				ulId = 'ul#network-' + $.fastEncode(network);

			if (type == 'chan')
				var rTabId = network + '-chan-' + chan.substr(1);
			else if (type == 'query')
				var rTabId = network + '-query-' + chan;
			else if (type == 'window')
				var rTabId = network + '-window';
			else if (type == 'other')
				var rTabId = network + '-other-' + chan.substr(1);
			else
				return;
			// set some variables based on the type

			if (mem[rTabId] != undefined)
			{
				return mem[rTabId];
			}
			else
			{
				var tab = new TabModel({rId: rTabId, ulId: ulId, network: oNetwork, chan: oChan, type: type, extra: extra});
				return tab.get('id');
			}
		},

		/* 
		 * destroyWindow
		 * 
		 * destroy an existing tab cleanly
		 */
		destroyWindow: function(tabId, remove)
		{
			var tab = tabCollections.getByCid(tabId);
			if (tab != undefined)
			{
				if (tab.get('type') == 'window' && remove)
					var r = confirm("Are you sure you want to remove this network? Please note that your logs will be removed, you can download them in the log viewer.");

				if ((!remove || (remove && tab.get('type') == 'window' && r == true)) || tab.get('type') != 'window')
					tab.get('view').destroy(remove);
			}
		},

		/* 
		 * windowConnectState
		 * 
		 * change a windows connection state
		 */
		windowConnectState: function(network, tabId, state, silent, data)
		{
			var silent = silent || false,
				prepend = data.prepend || false,
				date = data.time || null;

			if (state == 'connected')
			{
				tabCollections.each(function(tab)
				{
					if (userInfo.networks[tab.get('network')] == undefined) return;
					// network doesn't exist but tab does? idk, bail anyway.
					
					var linkText = tab.$link.find('a span.link').text(),
						port = (userInfo.networks[tab.get('network')].secure) ? '+' + userInfo.networks[tab.get('network')].port : userInfo.networks[tab.get('network')].port;
					
					if (tab.cid == tabId && linkText.substr(0, 1) == '(')
						tab.$link.find('a:first-child span.link').text(linkText.substr(1, linkText.length - 2)).removeClass('net-loader').addClass('net-loaded');
					// mark network tab as connected by changing it to IRCNode

					if (tab.get('network') == network)
						tab.set({disabled: false});
					// mark tab as enabled

					if (tab.get('network') == network && tab.get('type') == 'window')
					{
						parser.windowNotice(tab.cid, 'Connected to ' + userInfo.networks[network].name + ' (' + userInfo.networks[network].host + ':' + port + ')...', prepend, date);
						
						tab.$link.find('span.link').removeClass('net-loader').addClass('net-loaded');
						$('a#connect-link').text('Disconnect');
					}
					// mark it as connected

					if (selectedTab == tab.cid)
						$('a#close-link').addClass('danger').text('Disconnect');
				});
				// mark all tabs as connected
			}
			else if (state == 'connecting')
			{
				tabCollections.each(function(tab)
				{
					if (userInfo.networks[tab.get('network')] == undefined) return;
					// network doesn't exist but tab does? idk, bail anyway.
					
					var linkText = tab.$link.find('a span.link').text(),
						port = (userInfo.networks[tab.get('network')].secure) ? '+' + userInfo.networks[tab.get('network')].port : userInfo.networks[tab.get('network')].port;
					
					if (tab.cid == tabId && linkText.substr(0, 1) == '(')
						tab.$link.find('a:first-child span.link').text(linkText.substr(1, linkText.length - 2)).removeClass('net-loaded').addClass('net-loader');
					else if (tab.get('network') == network && linkText.substr(0, 1) == '(')
						tab.$link.find('a:first-child span.link').text(linkText.substr(1, linkText.length - 2)).removeClass('net-loader');
					// mark network tab as connected by changing it to IRCNode

					if (tab.get('network') == network && tab.get('type') == 'window')
					{
						parser.windowNotice(tab.cid, 'Connecting to ' + userInfo.networks[network].name + ' (' + userInfo.networks[network].host + ':' + port + ')...', prepend, date);
						$('a#connect-link').text('Disconnect');
					}
					// find all tabs matching the network and determine the size it needs to be

					if (selectedTab == tab.cid)
						$('a#close-link').addClass('danger').text('Disconnect');
				});
				// mark all tabs as connected
			}
			else if (state == 'disconnected' || state == 'closed' || state == 'failed')
			{
				tabCollections.each(function(tab)
				{
					if (userInfo.networks[tab.get('network')] == undefined) return;
					// network doesn't exist but tab does? idk, bail anyway.

					var message = 'Disconnected from ' + userInfo.networks[network].name + ', would you like to <a href="#" class="connect-link" data-content="' + network + '">connect</a>?',
						linkText = tab.$link.find('a:first-child span.link').text();

					if (state == 'failed')
						message = 'Failed to reconnect to ' + userInfo.networks[network].name + ', would you like to manually <a href="#" class="connect-link" data-content="' + network + '">reconnect</a>?';
					// different message for a different state

					if (tab.cid == tabId && linkText.substr(0, 1) != '(')
						tab.$link.find('a:first-child span.link').text('(' + linkText + ')').removeClass('net-loader').addClass('net-loaded');
					// do the opposite and turn IRCNode into (IRCNode)

					if (tab.get('network') == network)
					{
						tab.set({disabled: true});
						// mark tab as disabled

						if (tab.get('type') != 'window' && !silent)
							actions.destroyWindow(tab.cid, true);
						else if (tab.get('type') != 'window' && silent && linkText.substr(0, 1) != '(')
							tab.$link.find(' a:first-child span.link').text('(' + linkText + ')');
						else if (tab.get('type') == 'window')
							parser.windowNotice(tab.cid, message, prepend, date);
					
						$('a#connect-link').text('Connect');

						if (selectedTab == tab.cid)
							$('a#close-link').addClass('danger').text('Close');
					}
					// this tab is under network, so remove it.
				});
				// mark all tabs as disconnected.
			}
			// are we disconnected?
		},

		/* 
		 * nickNameInUse
		 * 
		 * handle ERR_NICKNAMEINUSE
		 */
		nickNameInUse: function(network, tabId, data)
		{
			parser.windowNotice(tabId, 'Nickname ' + data.args[1] + ' in use, please choose another one...', false);
			main.chat.setValue('/nick ');
			main.$chat.focus();
		}
	};

	$(window).resize(function(e)
	{		
		var oldWidth = fullContentWidth;
			fullContentWidth = ($(this).width() - $('#sidebar').outerWidth());
			height = $(this).height();
			tabHeight = height - (inputPadding + $('.topbar').outerHeight()),
			footerHeight = 0;
		// here we resize height and stuff.

		$('div#content-container div#content, div#inner-content').height($('div#holder').outerHeight() - $('.topbar').outerHeight() - 4);
		$('div#sidebar').height($(this).height() - ($('div.sidebar div.header').outerHeight() + $('div.sidebar div#footer').outerHeight()));
		// resize the content
		
		var tab = tabCollections.getByCid(selectedTab);
			tab.get('view').reDraw(true);

		tabCollections.resetTopicBar(tab);
		// reset the topic bar size
	});
});
