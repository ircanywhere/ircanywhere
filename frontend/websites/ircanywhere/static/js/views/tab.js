TabView = Backbone.View.extend({

	initialize: function(options)
	{
		this.ulId = $(options.ulId);
		this.tabId = options.tabId;
		this.tab = options.tab;
		this.userList = new UserListView(options);

		this.render(options);
	},

	events:
	{
		'hover div.overlay-bar': 'overlayHover',
		
		'click a[rel=channel-link]': 'channelLinkClick',
		'click a[rel=user-link]': 'userLinkClick',
		'dblclick a[rel=user-link]': 'userLinkDblClick',
		
		'click div.collapsed-head': 'toggleCollapsedClick',
		'click div.top-message-bar a#read-backlog': 'backlogReadClick',
		'click div.top-message-bar span.alert.highlight': 'backlogHighlightClick',
		'click div.top-message-bar': 'backlogBarClick'
	},

	overlayHover: function(e)
	{
		if (e.type == 'mouseenter')
		{
			clearTimeout($('span.chan-desc').attr('data-timeoutId'));
		}
		else
		{
			var element = 'span.chan-desc',
				tab = tabCollections.getByCid($(element).attr('data-id')),
				timeoutId = setTimeout(function() {
					tab.$msgs.find('div.overlay-bar').slideUp('fast');
				}, 650);	
			
			$(element).attr('data-timeoutId', timeoutId);
		}
	},

	channelLinkClick: function(e)
	{
		var chan = $(e.currentTarget).text(),
			tabId = mem[this.tab.get('network') + '-chan-' + chan.substr(1).toLowerCase()];

		if (tabCollections.getByCid(tabId) == undefined)
			client.socket.emit('data', {network: this.tab.get('network'), command: 'JOIN ' + chan});
		else
			actions.selectTab(tabId);

		e.preventDefault();
	},
	// handle #channel links

	userLinkClick: function(e)
	{
		var target = $(e.target),
			thisLink = (target[0].tagName == 'SPAN') ? target.parent() : target,
			popOver = $('div.popover'),
			prefix = thisLink.find('span.prefix'),
			prefixHTML = (prefix.length == 0 || (prefix.length > 0 && prefix.html() == '&nbsp;')) ? '' : prefix[0].outerHTML,
			action = (popOver.length == 0) ? 'show' : 'destroy';

		if (popOver.length > 0)
			$('a[rel=user-link]').popover('destroy');
		// remove any existing elements

		thisLink.popover({
			placement: 'left',
			trigger: '',
			html: true,
			title: '<h3>' + prefixHTML + thisLink.attr('data-nick') + '</h3><span class="mini">' + thisLink.attr('data-ident') + '@' + thisLink.attr('data-hostname') + '</span>',
			content: '<ul><li><a href="' + thisLink.attr('href') + '" id="open-link">Open</a></li><li><a href="#" id="whois-link" data-nick="' + thisLink.attr('data-nick') + '">Whois</a></li></ul>',
			container: 'body'
		}).popover(action);
		// create a new popover

		e.preventDefault();
	},
	// handle user links

	userLinkDblClick: function(e)
	{
		var target = $(e.target),
			thisLink = (target[0].tagName == 'SPAN') ? target.parent() : target,
			popOver = $('div.popover');

		if (thisLink.attr('rel') != 'user-link' && target.parents('div.popover').length == 0 && target != popOver && popOver.length > 0)
			$('a[rel=user-link]').popover('destroy');
	},

	toggleCollapsedClick: function(e)
	{
		var me = $(e.currentTarget),
			next = me.next();
			next.slideToggle();

		if (me.hasClass('open'))
			me.removeClass('open');
		else
			me.addClass('open');
		// alter the class and toggle it
	},

	backlogBarClick: function(e)
	{
		var tab = this.tab,
			unreadId = tab.get('toUnreadId'),
			selector = tab.$msgs.find('div.row[data-id=' + unreadId + ']');
		// get the tab and the unread id

		if (selector.length == 0)
		{
			tab.$msgs.find('div.mcontainer').find('div.row[data-type=privmsg][data-read=false]').attr('data-read', 'true');
			
			tab.$msgs.unbind('scroll');
			tab.$msgs.scrollTop(0);
			tab.scrollHandler();
		}
		else
		{
			tab.$msgs.scrollTo(selector);
		}
		// if the selector isnt found then it isnt out of the backlog yet, scroll to the top

		e.preventDefault();
	},
	// handle the onclick backlog bar

	backlogReadClick: function(e)
	{
		var tab = this.tab,
			messageBar = tab.$msgs.find('div.top-message-bar');

		messageBar.find('.hide').text(0);
		tab.markAsRead(true);
		// mark the messages as read

		tab.set({unread: 0, highlights: 0});
		// remove unread and highlight badges

		e.stopPropagation();
		e.preventDefault();
		// stop event bubbling etc
	},
	// handle the backlog read click

	backlogHighlightClick: function(e)
	{
		var tab = this.tab,
			selector = tab.$msgs.find('div.mcontainer div.row[data-read=false][data-highlight=true]').last().prev();
		// get the tab and the unread id

		if (selector.length == 0)
		{
			tab.$msgs.find('div.mcontainer').find('div.row[data-type=privmsg][data-read=false]').attr('data-read', 'true');
			
			tab.$msgs.unbind('scroll');
			tab.$msgs.scrollTo(selector);
			tab.scrollHandler();
		}
		else
		{
			tab.$msgs.scrollTo(selector);
		}
		// if the selector isnt found then it isnt out of the backlog yet, scroll to the top

		e.stopPropagation();
		e.preventDefault();
		// stop event bubbling etc
	},
	// handle the backlog highlight click

	handleHighlight: function(data, msg)
	{
		this.tab.set({highlights: this.tab.get('highlights') + 1});
		// increase the highlight number
			
		notifier.notify(data._id, data.network, data.args[0], msg);
	},

	cleanup: function(prepend, last, scrollPosition, force)
	{
		scrollPosition = scrollPosition || 0;
		force = force || false;

		if (prepend)
		{
			if (last && scrollPosition > 0)
				this.tab.$msgs.scrollTop(scrollPosition);
			// determine whether we need to scroll to a certain position

			this.tab.$msgs.find('div.mcontainer div.row:first').addClass('hide').removeClass('historyLoad').empty();
		}
		// replace the scrollbar into the previous position
		else if ((!prepend && this.tab.$msgs.isAtBottom()) || force)
		{
			this.tab.$msgs.scrollTop(this.tab.$msgs.find('.content').height());
		}
		// we re-initialise the scrollbar, to stop stuff getting ugly

		return this;
	},

	removeLast: function()
	{
		// TODO
		/*var actualRows = $('div#msgs-' + this.tabId + ' div.row:not([data-type="initial-divider"])').length - $('div#msgs-' + this.tabId + ' div.row[data-type*="divider"]').length,
			privmsgs = this.tab.get('privmsgs'),
			maxRows = 10,
			firstRow = $('div#msgs-' + this.tabId + ' div.row:not([data-type*="divider"]):first');
		
		if (actualRows > maxRows)
		{
			if (firstRow.attr('data-type') == 'privmsg')
				this.tab.set({privmsgs: privmsgs - 1});
			// is the first row a privmsg?

			firstRow.empty().remove();
			// remove the element

			var nextRow = firstRow.next(),
				firstMessage = $('div#msgs-' + this.tabId + ' div.row[data-type="privmsg"]:first');
			// get the next row

			this.tab.set({topEventId: nextRow.attr('data-id'), topMessageId: firstMessage.attr('data-id')});
			// update the top event id
		}*/

		return this;
	},

	addUIElement: function(options)
	{
		var netinfoN = (this.tab.get('type') != 'other') ? userInfo.networks[this.tab.get('network')] : {},
			closeLink = (this.tab.get('type') != 'other' && (!userInfo.account_type.canRemove && userInfo.networks[this.tab.get('network')].locked)) ? '' : '<a href="#" class="close">&times;</a>';
		// are we restricted?

		if (this.tab.get('type') == 'window' && (!userInfo.account_type.canRemove && netinfoN.locked))
			var template = 'tabLinkNetworkLocked';
		else if (this.tab.get('type') == 'window' && (userInfo.account_type.canRemove || !netinfoN.locked))
			var template = 'tabLinkNetworkUnlocked';
		else if (this.tab.get('type') == 'chan' || this.tab.get('type') == 'query')
			var template = 'tabLink';
		else
			var template = 'tabLink';
		// change the template based on the network and the user

		this.ulId.append($.tmpl(template, {
			id: this.tabId,
			type: this.tab.get('type'),
			hash: this.tab.get('hash'),
			title: this.tab.get('title'),
			cssClass: (this.tab.get('type') == 'chan' || this.tab.get('type') == 'query') ? '' : 'net-loader',
			chan: options.oChan,
			closeLink: closeLink
		}));
		// setup our tab link template

		this.tab.$link = $('li#link-' + this.tabId);
		// assign the tab link element to the tab

		$('div#network').on('click', 'li#link-' + this.tabId, function(e)
		{
			if (this.tab.get('highlights') > 0 && !notifier.checkPermissions())
				notifier.requestPermission();
		}.bind(this));

		$('div#network').on('click', 'li#link-' + this.tabId + ' a.close', {tabId: this.tabId}, function(e)
		{
			actions.destroyWindow(e.data.tabId, true);
			e.preventDefault();
		});
		// the reason this is here rather than elsewhere is that this can only be called from a user action, eg click.

		var elements = this.ulId.children('li').get();
			this.ulId.empty();
		// create the link in the ul's

		elements.sort(function(a, b)
		{
			var compA = $(a).children('a:first').text().toUpperCase(),
				compB = $(b).children('a:first').text().toUpperCase();

			if ($(a).attr('data-type') == 'window')
				compA = 'A' + compA;
			else if ($(a).attr('data-type') == 'chan')
				compA = 'B' + compA.substr(1);
			else if ($(a).attr('data-type') == 'query')
				compA = 'C' + compA;
			else
				compA = 'D' + compA.substr(1);

			if ($(b).attr('data-type') == 'window')
				compB = 'A' + compB;
			else if ($(b).attr('data-type') == 'chan')
				compB = 'B' + compB.substr(1);
			else if ($(b).attr('data-type') == 'query')
				compB = 'C' + compB;
			else
				compB = 'D' + compB.substr(1);

			return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
		});
		
		$.each(elements, function(idx, itm) { this.ulId.append(itm); }.bind(this));
	},

	addWindowElement: function(callback)
	{
		if (this.tab.get('type') != 'chan')
		{
			var template = (this.tab.get('type') == 'other') ? 'tabHtmlOther' : 'tabHtmlWindow';
			this.$el = $.tmpl(template, {
				id: this.tabId
			});

			$('div#channel-window-data').prepend(this.$el);
			// render the html and insert it
		}
		else
		{
			this.$el = $.tmpl('tabHtmlChannel', {
				id: this.tabId
			});
			
			$('div#channel-window-data').prepend(this.$el);
			// render the html and insert it

			this.userList.create();
			// setup the user list
		}
		// create the tab window

		this.tab.$tab = this.$el;
		this.tab.$msgs = this.$el.find('#msgs-' + this.tabId);
		this.tab.$list = this.$el.find('#list-' + this.tabId);
		this.tab.$table = this.$el.find('#table-' + this.tabId);
		// setup our cached elements

		callback();
	},

	hide: function()
	{
		if (this.tab.get('hidden') === true)
			return;
		// already hidden, let's forget this call

		var inner = this.$el.find('div.mcontainer'),
			scrollPosition = inner[0].scrollHeight - inner.height();

		this.tab.set({hidden: true, storedInput: main.chat.getValue()});
		// mark the tab as hidden and store the input

		this.tab.$link.removeClass('selected');
		this.tab.$link.find('a span.alerts').empty().remove();
		this.tab.$link.removeClass('hide');
		// alter the link styles
		
		client.hideNoNetworks();
		this.tab.$tab.hide();
		
		main.chat.setValue('');
		// hide the tab window and blank the input
	},

	show: function()
	{
		var oldTab = selectedTab;
		// tab is undefined, return.

		selectedNet = this.tab.get('network');
		selectedChan = this.tab.get('chan');
		selectedTab = this.tabId;
		// reset some variables

		if (this.tab.get('loading') == true)
		{
			client.showLoading();
			return;
		}
		else
		{
			client.hideLoading();
			$('div#channel-input, div#channel-window-data').show();
		}
		// don't show the tab if we're still loading..

		this.tab.set({hidden: false});
		// mark the tab as not hidden
		
		this.tab.$tab.show();
		this.tab.$link.addClass('selected');
		// alter some css styles and show the tab

		if (userInfo.networks != undefined && userInfo.networks[this.tab.get('network')] != undefined)
			$('label#nick-button').text(userInfo.networks[this.tab.get('network')].nick);
		// reset some styles and stuff

		this.setupLinks();
		// setup all the buttons and links
		 
		var date = new Date(),
			day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate(),
			month = ((date.getMonth() + 1) < 10) ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1),
			curDate = day + '-' + month + '-' + date.getFullYear();
		// get the current date in our standard log date format
		// TODO - I do this a lot, maybe I should wrap it in a function?

		if (this.tab.get('type') != 'window')
		{
			if (window.location.hash != this.tab.get('hash'))
				window.location.hash = this.tab.get('hash');
			
			document.title = userInfo.networks[this.tab.get('network')].name + ' / ' + this.tab.get('title') + ' / IRCAnywhere';
			$('a#view-logs-link').attr('href', '/logs/' + userInfo.networks[this.tab.get('network')].url + '/' + encodeURIComponent(this.tab.get('name')) + '/' + curDate);
		}
		else
		{
			if (window.location.hash != this.tab.get('hash'))
				window.location.hash = this.tab.get('hash');
			
			document.title = this.tab.get('title') + ' / IRCAnywhere';
			$('a#view-logs-link').attr('href', '/logs/' + userInfo.networks[this.tab.get('network')].url + '/' + userInfo.networks[this.tab.get('network')].host + '/' + curDate);
		}
		// set some variables.

		this.tab.reCalculateScrollState();
		// start setting up a new messages scrollbar

		tabHeight = (this.tab.get('type') == 'other') ? height - (borderPadding + $('.topbar').outerHeight()) : height - (inputPadding + $('.topbar').outerHeight());
		this.reDraw();
		// hide the input box on other boxes
	},

	setupLinks: function()
	{
		if (this.tab.get('type') == 'query')
		{
			var network = userInfo.networks[selectedNet];

			tabCollections.changeTopicBar(network.name, '', '', this.tab.$link.find('a:first span').text());
			$('a#view-logs-link, a#hide-extra-link, a#hide-users-link, a#set-topic-link, span#divider1').parent().hide();
			// set the channel description crack up
		}
		else if (this.tab.get('type') != 'window' && this.tab.get('type') != 'other')
		{
			tabCollections.resetTopicBar(this.tab);
			$('a#view-logs-link, a#hide-extra-link, a#hide-users-link, a#leave-chan-link, a#edit-network-link, a#connect-link, span#divider1, span#divider2').parent().show();
			$('a#close-link').removeClass('danger connect-link').text('Close');
		}
		else if (this.tab.get('type') == 'window')
		{
			var network = userInfo.networks[selectedNet],
				closeText = (network.status == 'connected' || network.status == 'connecting') ? 'Disconnect' : 'Close';

			tabCollections.changeTopicBar(network.name, '', selectedTab, userInfo.networks[this.tab.get('network')].url)
			
			$('a#hide-extra-link, a#hide-users-link, a#leave-chan-link, a#set-topic-link, span#divider2').parent().hide();
			$('a#view-logs-link, a#edit-network-link, a#connect-link, span#divider1, span#divider2').parent().show();
			$('a#close-link').addClass('danger connect-link').text(closeText);
			// set the channel description up and alter link titles etc

			var divHtml = $('<span class="channel-name">' + network.name + '</span> <span class="topic">' + userInfo.networks[this.tab.get('network')].url + '</span>');
			this.tab.$msgs.find('div.overlay-bar').empty().html(divHtml);
		}
		else
		{
			var network = userInfo.networks[selectedNet];
			tabCollections.changeTopicBar(network.name, '', '', this.tab.$link.find('a:first span').text());
			$('a#view-logs-link, a#hide-extra-link, a#hide-users-link, a#leave-chan-link, a#set-topic-link, span#divider1').parent().hide();
			$('a#edit-network-link, a#connect-link, span#divider2').parent().show();
			$('a#close-link').removeClass('danger connect-link').text('Close');
			// hide the menus
		}
		// set some data in the channel header

		var me = this.tab.get('ulCollection').filter(function(model) { return model.get('user') == userInfo.networks[this.tab.get('network')].nick; }.bind(this)),
			modes = (me[0] == undefined) ? '' : me[0].modes;

		$('a#edit-network-link').attr('href', '#?/edit-network/' + userInfo.networks[this.tab.get('network')].url);

		if (modes == '' || modes == 'v')
			$('a#set-topic-link').hide();
		else
			$('a#set-topic-link').show();
		// determine whether we're able to set the topic or not

		if (this.tab.get('hide_userlist'))
			$('a#hide-users-link').text('Show Users');
		else
			$('a#hide-users-link').text('Hide Users');
		// hide users link

		if (this.tab.get('hide_joinsparts'))
			$('a#hide-extra-link').text('Show Joins/Parts');
		else
			$('a#hide-extra-link').text('Hide Joins/Parts');
		// hide joins/parts link

		if (userInfo.networks != undefined && userInfo.networks[this.tab.get('network')] != undefined && userInfo.networks[selectedNet].status == 'connected')
			$('a#connect-link').text('Disconnect').attr('data-content', selectedNet);
		else
			$('a#connect-link').text('Connect').attr('data-content', selectedNet);
		// change the connect links

		if (this.tab.get('type') != 'window' && this.tab.get('type') != 'chan')
			$('a#leave-chan-link').text('Close');
		else
			$('a#leave-chan-link').text('Leave');
		// change the leave channel link

		if (this.tab.get('type') == 'other')
			$('div#channel-input').hide();
		else
			$('div#channel-input').show();
		// change the channel input

		if (this.tab.get('disabled'))
		{
			main.$chat.attr('disabled', 'disabled');
			main.chat.setValue(this.tab.get('storedInput'));
		}
		else if (!this.tab.get('disabled'))
		{
			main.$chat.removeAttr('disabled').focus();
			main.chat.setValue(this.tab.get('storedInput'));
		}
		// does the input form need to be disabled? also reload the input
	},

	reDraw: function(soft)
	{
		var soft = soft || false;
		// check if the rows need to be redrawn, this is expensive so we only need to do it on resize

		if (this.tab.get('seenBefore') === false)
			this.tab.set({scrollPosition: 0, seenBefore: true});
		// reset the scroll position

		if (this.tab.get('type') == 'chan' && !this.tab.get('hide_userlist'))
		{
			var mheight = this.tab.$msgs.find('div.mcontainer').height(),
				bPadding = ((tabHeight + borderPadding) < mheight) ? 3 : dblBorderPadding;
			
			this.tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - userListWidth - 20);
			
			if (this.tab.get('scrollPosition') - this.tab.$msgs.height() <= 0 || this.tab.$msgs.isAtBottom())
				this.tab.$msgs.scrollTop(this.tab.$msgs.find('.content').height());
		}
		else if (this.tab.get('type') != 'other')
		{
			this.tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - 20);
			
			if (this.tab.get('scrollPosition') - this.tab.$msgs.height() <= 0 || this.tab.$msgs.isAtBottom())
				this.tab.$msgs.scrollTop(this.tab.$msgs.find('.content').height());
		}
		else
		{
			this.tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - 20);
		}
		// we re-initialise the scrollbar, to stop stuff getting ugly

		this.tab.$msgs.find('span.column2').width(this.tab.$msgs.width() - 120);
		// TODO - Revise this, I'll definitely be able to speed it up some how

		if (!soft)
			this.setupLinks();
		// resetup the links

		return this;
	},

	destroy: function(remove)
	{
		var network = this.tab.get('network'),
			tabId = this.tab.get('id'),
			rTabId = this.tab.get('rId'),
			chan = this.tab.get('name'),
			type = this.tab.get('type'),
			chan = (type == 'chan' || type == 'other') ? chan.substr(1) : chan,
			tabId = mem[rTabId];

		if (type == 'chan')
		{
			client.socket.emit('data', {network: network, command: 'PART ' + this.tab.get('name')});
			
			delete cookieData[this.tab.get('name').toLowerCase() + ':userlist'], cookieData[this.tab.get('name').toLowerCase() + ':hideextra'];
			(JSON.stringify(cookieData) != '{}') ? $.cookie('tab-options', JSON.stringify(cookieData)) : $.cookie('tab-options', null);
		}
		// if it's a channel we shall PART it

		if (type == 'window')
		{
			if (!userInfo.account_type.canRemove && userInfo.networks[network].locked)
				return;

			_.clone(tabCollections).each(function(tab)
			{
				if (tab.get('network') == network)
				{
					tab.$tab.empty().remove();
					delete mem[tab.get('rId')];
					tabCollections.remove(tab);
					// remove the tab and it's div
				}
			});

			delete netinfo[network];
			delete mem[rTabId];
			tabCollections.remove(tabCollections.getByCid(tabId));
			
			$('ul#network-' + $.fastEncode(network)).empty().remove();
			this.$el.empty().remove();
			// remove the ul

			if (remove)
				client.socket.emit('removeNetwork', {network: network});
			// remove the network.
		}
		// if the tab is a network we just remove the entire ul and sod off
		else
		{
			this.tab.$link.empty().remove();
			this.tab.$tab.empty().remove();

			delete mem[rTabId];
			tabCollections.remove(tabCollections.getByCid(tabId));
		}
		// remove the object and swap to the next tab

		if (previousHashes[previousHashes.length - 1] == undefined)
		{
			client.showNoNetworks().hideLoading();
		}
		else
		{
			var hashes = previousHashes,
				found = false;
				hashes.reverse();

			for (var hash in hashes)
			{
				if (tabCollections.getByCid(hashes[hash]) != undefined)
				{
					actions.selectTab(hashes[hash]);
					found = true;
					break;
				}
			}
			// if the tab isn't defined, check the next one

			if (!found && tabCollections.length > 0)
			{
				var tab = tabCollections.at(0);
				actions.selectTab(tab.get('id'));
			}
			// if we have tabs then boom, show the first one
			else if (!$('div#home-content').is(':visible') && !found && tabCollections.length == 0)
			{
				client.showNoNetworks();
			}
		}
		// determine whether we go to the next tab or not.
	},

	render: function(options)
	{
		this.addUIElement(options);
		this.addWindowElement(function() {
			this.tab.playbackHandler();
		}.bind(this));
		// add the elements and then setup event handlers

		this.$el.hide();
		this.delegateEvents(this.events);
		// do some css stuff

		return this;
	},
});