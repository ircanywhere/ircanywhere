TabModel = Backbone.Model.extend({

	/* called when a new tabModal is created */
	initialize: function(options)
	{
		var type = options.type,
			rTabId = options.rId,
			chan = options.chan,
			network = options.network,
			ulId = options.ulId,
			url = userInfo.networks[network].url,
			hashParts = window.location.hash.split('/');
			
		if (type == 'window')
			var hash = '#!/' + url;
		else if (type == 'other')
			var hash = '#!/' + url + '/' + encodeURIComponent(chan).replace('%2F', '%40');
		else if (type != 'other' && type != 'window')
			var hash = '#!/' + url + '/' + encodeURIComponent(chan);
		// create the hash

		var newDate = new Date(1970, 01, 01),
			newPDate = new Date(),
			settings = {
				id: this.cid,
				rId: rTabId,
				network: network,
				type: type,
				name: chan.toLowerCase(),
				title: chan,
				hash: hash,
				hide_userlist: false,
				disabled: false,
				seenBefore: false,
				topic: '',
				modes: '',
				lastTime: newDate,
				lastTimeP: newPDate,
				privmsgs: 0,
				unread: 0,
				highlights: 0,
				scrollPosition: -10,
				topMessageId: null,
				topEventId: null,
				toUnreadId: null,
				finishedPlayback: false,
				loading: (type == 'chan') ? true : false,
				hidden: true,
				scrollLock: false,
				backLog: [],
				playbackData: {},
				prependHTML: '',
				buffer: [],
				bufferIndex: -1,
				storedInput: '',
				defaultInput: '',
				newInputs: [],
				newId: 0
			};

		$.extend(settings, options.extra);
		// extend the settings

		this.set(settings);
		// setup the tab

		mem[rTabId] = this.cid;
		tabCollections.add(this);

		var view = new TabView({tabId: this.cid, tab: this, oNetwork: network, oChan: chan, ulId: ulId});
			this.set({view: view});
		// setup the view

		var ulCollection = new UserCollection({tab: this, view: view});
			this.set({ulCollection: ulCollection});
		// setup the user listcollection
		
		if (type == 'chan')
		{
			this.handleTabOptions(chan);
			client.socket.emit('getBacklog', {network: network, target: chan, id: null, status: false, limit: 100});
		}
		else if (type == 'query')
		{
			var topId = this.get('topMessageId'),
				bottomId = this.get('bottomMessageId');
			client.socket.emit('getBacklog', {network: network, from: userInfo.networks[network].nick, target: chan, id: topId, btmId: bottomId, status: false, limit: 30});
		}
		// load the previous messages in query windows

		this.handleEvents();
	},

	handleTabOptions: function(chan)
	{
		cookieData = (JSON.parse($.cookie('tab-options')) == null) ? {} : JSON.parse($.cookie('tab-options'));
		if (cookieData[chan.toLowerCase() + ':userlist'] != undefined)
			main.toggleUserList(this, true);
		if (cookieData[chan.toLowerCase() + ':hideextra'] != undefined)
			main.toggleExtra(this, true);
	},

	handleEvents: function()
	{
		this.on('change:finishedPlayback', function(model, finished)
		{
			if (finished)
			{
				var playbackData = model.get('playbackData');
				client.finishPlayback(playbackData.data, model, playbackData.topDivId);
				
				var backlog = model.get('backLog');
				for (var i in backlog)
				{
					var bufferItem = backlog[i];
					bufferItem.cont();
				}

				model.set({playbackData: {}});
				model.set({backLog: []});
			}
			// if tab is finished

			var allFinished = true;
			tabCollections.each(function(tab) {
				allFinished = (!tab.get('finishedPlayback')) ? false : true;
			});
			// check if all tabs are finished

			if (allFinished)
			{
				try {
					Backbone.history.start();
				} catch(e) {}
				// try to start backbone history, or update the hash
			}
		});
		// handle the finished playback backlog

		this.on('change:disabled', function(model, disabled)
		{
			if (selectedTab == model.cid && disabled)
				main.$chat.attr('disabled', 'disabled');
			else if (selectedTab == model.cid && !disabled)
				main.$chat.removeAttr('disabled');
			// disable the input form field
		});
		// disabled boolean

		this.on('change:loading', function(model, loading)
		{
			if (!loading && model.get('id') == selectedTab)
			{
				client.hideLoading();
				model.get('view').show();
			}
			else if (loading)
			{
				client.showLoading();
			}
		});
		// loading boolean

		this.on('change:unread', function(model, unread)
		{
			this.updateUnreadIcon(unread);
		});

		this.on('change:highlights', function(model, highlights)
		{
			this.updateHighlightIcon(highlights);

			totalHighlights = 0;
			tabCollections.each(function(tab) {
				totalHighlights = totalHighlights + tab.get('highlights');
			});
			// calculate number of highlights

			if (totalHighlights == 0)
				$('#favicon').attr('href', hostUrl + '/static/images/favicon.ico');
			else if (totalHighlights <= 10)
				$('#favicon').attr('href', hostUrl + '/static/images/' + totalHighlights + 'favicon.ico');
			else
				$('#favicon').attr('href', hostUrl + '/static/images/10pfavicon.ico');
			// update the favicon

			if (totalHighlights == 0)
				document.title = document.title.replace(/\([-0-9]+\) (.*)$/, '$1');
			else
				document.title = '(' + totalHighlights + ') ' + document.title.replace(/\([-0-9]+\) (.*)$/, '$1');
			// alter document title to add the highlight number to the front aswell.
		});
		// when highlights changes
	},

	playbackHandler: function()
	{
		var _this = this;
		this.$msgs.debounce('scroll', function(e)
		{
			if (_this.$msgs[0].scrollTop !== 0)
				return;
			// bail if its not at the top

			if ((this.get('type') == 'chan' || this.get('type') == 'query' || this.get('type') == 'window') && this.get('scrollLock') === false)
			{
				var network = this.get('network'),
					fromId = this.get('topEventId'),
					status = (this.get('type') == 'window') ? true : false,
					target = (status) ? userInfo.networks[network].nick.toLowerCase() : this.get('name');

				this.set({scrollLock: true, scrollPosition: -10, finishedPlayback: false, prependHTML: ''});
				// set the tab as locked so the user can't hit the top scroll again, could insert
				// double the messages and lock the fuck out of the browser, and all they need to do is hit
				// up a couple of times during loading.

				if (fromId == null || fromId == undefined || (fromId != undefined && fromId.charAt(0) == '-'))
				{
					this.$msgs.find('div.mcontainer div.row[data-id=' + fromId + ']').nextAll().each(function(index, element)
					{
						fromId = $(element).attr('data-id');
						if (fromId != undefined && fromId.charAt(0) != '-')
							return false;
					});
				}
				// determine if the topId is valid?
				
				this.$msgs.find('div.mcontainer div.row:first').addClass('historyLoad').removeClass('hide').empty().html('<div class="loader"><img src="/static/images/loader-1.gif" alt="Loading..." /></div>');
				// show the loading previous history message

				client.socket.emit('getBacklog', {network: network, target: target, id: fromId, status: status, limit: 100});
			}
		}.bind(this), 250);
		// create the top scroll events
	},

	updateUnreadIcon: function(count)
	{
		if (this.get('type') != 'chan' && this.get('type') != 'window')
			return;
		// skip other tabs other than channels

		var linkLi = this.$link.find('a:first-child'),
			linkSpan = linkLi.find('span.link'),
			unreadIcon = linkLi.find('span.unread'),
			highlightIcon = linkLi.find('span.highlight'),
			resetLinkSpan = '<span class="link">' + this.get('title') + '</span>';

		if (unreadIcon[0] == undefined && highlightIcon[0] == undefined && count > 0)
			linkLi.empty().html('<span class="alert unread">' + count + '</span>' + resetLinkSpan);
		else if (unreadIcon[0] == undefined && highlightIcon[0] != undefined && count > 0)
			linkLi.empty().html('<span class="alert unread">' + count + '</span>' + highlightIcon[0].outerHTML + resetLinkSpan);
		else if (count > 0)
			unreadIcon.text(count);
		else if (count <= 0)
			unreadIcon.empty().remove();
		// update the unread icon

		return this;
	},

	updateHighlightIcon: function(count)
	{
		var messageBar = this.$msgs.find('div.top-message-bar'),
			linkLi = this.$link.find('a:first-child'),
			linkSpan = linkLi.find('span.link'),
			unreadIcon = linkLi.find('span.unread'),
			highlightIcon = linkLi.find('span.highlight'),
			resetLinkSpan = '<span class="link">' + this.get('title') + '</span>';

		if (unreadIcon[0] == undefined && highlightIcon[0] == undefined && count > 0)
			linkLi.empty().html('<span class="alert highlight">' + count + '</span>' + resetLinkSpan);
		else if (unreadIcon[0] != undefined && highlightIcon[0] == undefined && count > 0)
			linkLi.empty().html(unreadIcon[0].outerHTML + '<span class="alert highlight">' + count + '</span>' + resetLinkSpan);
		else if (count > 0)
			highlightIcon.text(count);
		else if (count <= 0)
			highlightIcon.empty().remove();
		// update the highlight icon

		if (count <= 0)
			messageBar.find('span.highlight-extra').empty().remove();
		else
			messageBar.find('span.alert.highlight').text(count);
		// update message bar because highlights seen has changed

		return this;
	},

	defaultMessageBar: function(messages, highlightCount)
	{
		if (messages == undefined || messages == null || messages <= 0 || this.get('type') != 'chan')
			return;
		// some housekeeping

		var elements = this.$msgs.find('div.mcontainer div.row[data-type=privmsg][data-read=false]').length,
			messageBar = this.$msgs.find('div.top-message-bar'),
			plural = (messages == 1) ? 'message' : 'messages',
			hplural = (highlightCount == 1) ? 'highlight' : 'highlights',
			remaining = (messages > elements) ? (messages - elements) : 0,
			highlightMarkup = (highlightCount <= 0) ? '' : '<span class="highlight-extra"> and <span class="alert highlight">' + highlightCount + '</span> ' + hplural + '</span>',
			markup = '<span class="left"><span class="hide">' + remaining + '</span><span class="message-number">' + messages + '</span> new ' + plural + highlightMarkup + ' since your last visit</span><span class="right"><a href="#" id="read-backlog">Mark as read</a></span>';
		// variable definitions

		this.set({unread: messages, highlights: highlightCount});
		// update badges

		messageBar.empty().html(markup).show();
		// insert the message bar
	},

	reCalculateScrollState: function()
	{
		var _this = this,
			messageBar = this.$msgs.find('div.top-message-bar'),
			container = this.$msgs.find('div.mcontainer'),
			scrollBottom = container.height() + container.scrollTop(),
			scrollTop = scrollBottom - container.height(),
			elements = highlights = topUnread = bottomUnread = unreadElements = 0,
			markAsRead = false;
		// a lot of variables here. So much shit going on

		if (this.get('type') != 'chan' && this.get('type') != 'query' && this.get('type') != 'window')
			return false;
		// ignore other tabs

		container.find('div.row[data-type=privmsg][data-read=false], div.row[data-type=notice][data-read=false]').each(function(n)
		{
			var offset = (scrollTop == 0) ? 0 : 0,
				topOffset = $(this)[0].offsetTop - offset,
				elHeight = $(this)[0].clientHeight,
				realOffset = (topOffset + elHeight);
			
			elements++;

			if ((scrollTop == 0 || realOffset > scrollTop && topOffset < _this.get('scrollPosition')) && selectedTab == _this.cid && window.isActive)
			{
				if ($(this).attr('data-highlight') == 'true')
					highlights++;
				
				markAsRead = true;
				$(this).attr('data-read', 'true');
			}
			// mark messages in the visible viewport as read
			else
			{
				if (_this.get('scrollPosition') <= 0)
					topUnread++;
				else if (realOffset < scrollTop)
					topUnread++;
				else if (topOffset > _this.get('scrollPosition'))
					bottomUnread++;
			}
			// otherwise do some calculations
		});

		var remainingNumber = parseInt(messageBar.find('.hide').text()),
			topBarUnread = topUnread + remainingNumber,
			actuallyUnread = (_this.get('scrollPosition') < 0) ? topBarUnread : topBarUnread + bottomUnread,
			newHighlights = (_this.get('type') == 'query') ? actuallyUnread : _this.get('highlights') - highlights;

		if (topBarUnread <= 0 && messageBar.is(':visible'))
			messageBar.hide();
		// hide top message bar

		if (topBarUnread > 1)
		{
			if (!messageBar.is(':visible'))
				_this.defaultMessageBar(topBarUnread, newHighlights);
			// show the messagge bar
			else	
				messageBar.find('.message-number').text(topBarUnread);
			// update the message bar
		}

		if (actuallyUnread > 0 || !markAsRead)
		{
			clearTimeout(_this.scrollTimeout);
			_this.scrollTimeout = setTimeout(function()
			{
				var all = (container.find('div.row[data-type=privmsg][data-read=false], div.mcontainer div.row[data-type=notice][data-read=false]').length == 0) ? true : false;
				_this.markAsRead(all);
			}, 5000);
			// we wait 5 seconds, this means they've been finished scrolling for around 5 seconds
			// before we tell the server that we've read those messages. Lower is a waste of bandwidth
			// higher we run the risk of the messages never being marked if a refresh happens
		}

		_this.set({unread: actuallyUnread, highlights: newHighlights, scrollPosition: scrollBottom});
		// update badges
	},

	scrollHandler: function()
	{
		if (this.get('type') == 'chan' || this.get('type') == 'query' || this.get('type') == 'window')
		{
			this.$msgs.find('.content').unbind('scroll');
			this.$msgs.find('.content').debounce('scroll', this.reCalculateScrollState.bind(this), 50);
		}
	},

	markAsRead: function(all)
	{
		var messageBar = this.$msgs.find('div.message-bar');

		if (all)
		{
			this.$msgs.find('div.mcontainer div.row[data-type=privmsg][data-read=false], div.mcontainer div.row[data-type=notice][data-read=false]').each(function(n) {
				$(this).attr('data-read', 'true')
			});

			var query = (this.get('type') == 'chan') ? {network: this.get('network'), target: this.get('name'), status: false, privmsg: true} : {network: this.get('network'), target: this.get('name'), from: userInfo.networks[this.get('network')].nick, status: false, privmsg: true};
				query = (this.get('type') == 'window') ? {network: this.get('network'), status: true, privmsg: false} : query;

			client.socket.emit('markRead', query);
			messageBar.hide();
			// hide message bar
		}
		// mark everything as read
		else
		{
			var marked = this.get('msgsMarkedRead'),
				msgs = [];
				marked = (marked == undefined) ? [] : marked;

			this.$msgs.find('div.mcontainer div.row[data-type=privmsg][data-read=true], div.mcontainer div.row[data-type=notice][data-read=true]').each(function(n)
			{
				var id = $(this).attr('data-id');
				if (marked.indexOf(id) == -1)
					msgs.push(id);
			});
		}
		// otherwise there are records that have already been marked as read by the scrollhandler
		// let's get these records and send it to the backend.

		if (!all && msgs.length > 0)
		{
			this.set({msgsMarkedRead: marked.concat(msgs)});

			var query = (this.get('type') == 'chan') ? {network: this.get('network'), target: this.get('name'), ids: msgs, status: false, privmsg: true} : {network: this.get('network'), target: this.get('name'), from: userInfo.networks[this.get('network')].nick, ids: msgs, status: false, privmsg: true};
				query = (this.get('type') == 'window') ? {network: this.get('network'), status: true, privmsg: false, ids: msgs} : query;

			client.socket.emit('markRead', query);
		}
		// we've only been told to mark a few messages as read so we do that here
	}
});