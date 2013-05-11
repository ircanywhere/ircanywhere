var MainView = Backbone.View.extend({

	initialize: function()
	{
		$(window).focus(function()
		{
			if (this.isActive === false && client.connected)
				client.socket.emit('changeTab', {tab: selectedTab, active: true});
			// tell the backend we're active again

			main.$chat.focus();
			this.isActive = true;
			// mark the window is active

			var tab = tabCollections.getByCid(selectedTab);
			if (tab != null)
			{
				tab.reCalculateScrollState();
				// setup scroll handler incase theres new messages
			}
			// do some work on selectedTab
		});

		$(window).blur(function()
		{
			if (this.isActive === true && client.connected)
				client.socket.emit('changeTab', {tab: selectedTab, active: false});
			// tell the backend we're active again
			
			this.isActive = false;
		});
		// window blurs

		$('body').tooltip({
			selector: 'a[rel=twipsy]',
			placement: 'right',
			trigger: 'hover'
		});
		// rel links, which means they should always be prevented, but do something other than tabbing

		fullContentWidth = ($(window).width() - $('#sidebar').outerWidth());
		height = $(document).height();
		tabHeight = height - (inputPadding + $('.topbar').outerHeight());
		// set some widths up
		
		$('div#content-container div#content, div#inner-content').height($('div#holder').outerHeight() - $('.topbar').outerHeight() - 4);
		// resize the content

		this.currentSettingsTab = 'settings';
		// set the current settings tab

		this.chat = new InputView();
		this.$chat = this.chat.$el;
		$('div#channel-input span').html(this.$chat);
		// setup the input field
	},

	events:
	{
		'keypress': 'onKeyPress',
		'keydown': 'onKeyDown',

		'click a[rel=twipsy]': 'preventDefault',
		'mouseenter div.overlay-bar': 'chanDescEnter',
		'mouseleave div.overlay-bar': 'chanDescLeave',
		'mouseenter div.topic-wrap': 'chanDescEnter',
		'mouseleave div.topic-wrap': 'chanDescLeave',

		'click': 'userLinkDblClick',
		'click a#open-link': 'openWindowClick',
		'click a#whois-link': 'whoisUserClick',
		'click span.alert.unread': 'backlogReadClick',

		'click input.submit-modal-form': 'modalFormSubmit',
		'click input#settings-submit': 'settingsFormSubmit',

		'click .add-on input:checkbox': 'checkBoxClick',
		'click ul.setting-tabs li a': 'changeSettingsTab',

		'click a#set-topic-link': 'setTopicClick',
		'click a#hide-users-link': 'hideUsersClick',
		'click a#hide-extra-link': 'hideExtraClick',
		'click a#view-logs-link': 'viewLogsClick',
		'click a#leave-chan-link, a#close-link': 'leaveChanClick',
		'click a.connect-link': 'connectClick',
		'click label#nick-button': 'changeNickClick'
	},

	onKeyPress: function(e)
	{
		var keyCode = e.keyCode || e.which,
			key = { enter: 13, space: 32 },
			tab = tabCollections.getByCid(selectedTab);

		if (userInfo.networks == undefined || selectedNet == null || tab == undefined || tab.get('disabled'))
			return;

		if (keyCode == key.enter && loggedIn)
		{
			var value = this.chat.getValue(),
				buffer = tab.get('buffer');
			
			buffer.unshift(value);
			tab.set({buffer: buffer});
			// add the line to the buffer

			this.chat.send(tab, value);
			this.chat.setValue('');
			// send the item and reset the chat box

			e.preventDefault();
		}
		else
		{
			if (keyCode == key.space)
				tab.set({newId: 0, newInputs: []});
			// reset new inputs and id

			this.$chat.focus();
			// focus the field so the character is forced into it
		}
	},

	onKeyDown: function(e)
	{
		var keyCode = e.keyCode || e.which,
			tab = tabCollections.getByCid(selectedTab);

		if (keyCode == 8)
		{
			tab.set({newId: 0, newInputs: []});
			// reset new inputs and id

			if (!this.$chat.is(':focus'))
			{
				var input = this.chat.getValue();
				this.$chat.focus();
			}
			// if chat bar isnt focused then enter the backspace
		}
	},

	preventDefault: function(e)
	{
		e.preventDefault();
	},

	chanDescEnter: function(e)
	{
		var element = $('span.chan-desc'),
			tab = tabCollections.getByCid(element.attr('data-id')),
			timeinId = setTimeout(function()
			{
				if (tab != undefined)
				{
					if (tab.get != undefined && tab.get('type') != 'other')
						tab.$msgs.find('div.overlay-bar').slideDown('fast');
				}
			}, 500);

		element.attr('data-timeinId', timeinId);
		clearTimeout(element.attr('data-timeoutId'));
	},

	chanDescLeave: function(e)
	{
		var element = $('span.chan-desc'),
			tab = tabCollections.getByCid(element.attr('data-id')),
			timeoutId = setTimeout(function()
			{
				if (tab != undefined)
				{
					if (tab.get != undefined && tab.get('type') != 'other')
						tab.$msgs.find('div.overlay-bar').slideUp('fast');
				}
			}, 500);	
		
		element.attr('data-timeoutId', timeoutId);
		clearTimeout(element.attr('data-timeinId'));
	},

	userLinkDblClick: function(e)
	{
		var target = $(e.target),
			thisLink = (target[0].tagName == 'SPAN') ? target.parent() : target,
			popOver = $('div.popover');

		if (thisLink.attr('rel') != 'user-link' && target.parents('div.popover').length == 0 && target != popOver && popOver.length > 0)
			$('a[rel=user-link]').popover('destroy');
	},

	openWindowClick: function(e)
	{
		$('a[rel=user-link]').popover('destroy');
	},

	whoisUserClick: function(e)
	{
		client.socket.emit('data', {network: selectedNet, command: 'WHOIS ' + $(e.currentTarget).attr('data-nick')});
		// send the whois out

		$('a[rel=user-link]').popover('destroy');
		// close the popup

		actions.selectTab(mem[selectedNet + '-window']);
		// change tab

		e.preventDefault();
	},

	backlogReadClick: function(e)
	{
		var me = $(e.currentTarget),
			parent = me.parents('li'),
			id = parent.attr('id').replace('link-', ''),
			tab = tabCollections.getByCid(id);

		if (tab != undefined)
			tab.get('view').backlogReadClick(e);
	},

	modalFormSubmit: function(e)
	{
		var form = $('form#network-form');
		if ($('input#submit-type').val() == 'add-network')
		{
			var emitEvent = 'addNetwork',
				params = form.serializeObject();
			
			client.socket.emit(emitEvent, params);
		}
		else if ($('input#submit-type').val() == 'edit-network')
		{
			var emitEvent = 'updateNetwork',
				params = form.serializeObject();
				params.networkId = selectedNet;

			if (!userInfo.account_type.canRemove && userInfo.networks[selectedNet].locked)
				params['server-hostname'] = form.find('input#server-hostname').val();
			// insert this manually if the form isn't editable

			client.socket.emit(emitEvent, params);
		}
		// update the information, GOGO.

		$('div#home-content').scrollTop(0);
		
		e.preventDefault();
	},
	// handle the add/edit network form. we bind to a live click event rather than a submit
	// because the browser autocorrects my html and cuts the buttons out of the form :@
	// we also handle two forms here, two birds with one stone basically!

	settingsFormSubmit: function(e)
	{
		var type = $(e.currentTarget).attr('data-content'),
			postUrl = '/settings/' + type;
		// get the url
		
		$.post(postUrl, $('form#' + type + '-form').serialize(), function(data)
		{
			if (data.error)
			{
				$('div#' + type + '-message-holder').empty().html('<br /><div class="alert-message block-message error"><ul></ul></div>');
				for (var msg in data.error_message)
					$('div#' + type + '-message-holder div ul').append('<li>' + data.error_message[msg] + '</li>');
			}
			// if data.error = true then show the error etc.
			else
			{
				$('div#' + type + '-message-holder').empty().html('<br /><div class="alert-message block-message success"><p>' + data.success_message + '</p></div>');

				if (type != 'settings')
					$('form#' + type + '-form').reset();
				// display the success message and reset the form
				else if (updateInitJSON != undefined)
					$.getJSON('/init', updateInitJSON);
				// reset the data variable
			}

			$('div#home-content').scrollTop(0);
			
		}, 'json');

		e.preventDefault();
	},

	checkBoxClick: function(e)
	{
		if (e.currentTarget.checked)
			$(e.currentTarget).parents('.add-on').addClass('active');
		else
			$(e.currentTarget).parents('.add-on').removeClass('active');
	},
	// bootstrap checkbox addon logic

	changeSettingsTab: function(e)
	{
		var newTab = $(e.target).attr('data-content');
		
		$('ul.setting-tabs li').removeClass('active');
		$(e.target).parent().addClass('active');

		$('div.left-set div#tab-' + this.currentSettingsTab).hide();
		this.currentSettingsTab = newTab;
		
		$('div.left-set div#tab-' + this.currentSettingsTab).show();
		$('div.modal-footer #settings-submit').attr('data-content', this.currentSettingsTab);
		
		e.preventDefault();
	},

	setTopicClick: function(e)
	{
		if (tabCollections.getByCid(selectedTab).get('type') != 'chan') return;
		// only work on channels

		main.chat.setValue('/topic ' + selectedChan + ' ');
		main.$chat.focus();

		e.preventDefault();
	},
	// handle the 'Set Topic' link

	hideUsersClick: function(e)
	{
		if ($(e.currentTarget).text() == 'Hide Users')
			this.toggleUserList(tabCollections.getByCid(selectedTab), true);
		else
			this.toggleUserList(tabCollections.getByCid(selectedTab), false);

		e.preventDefault();
	},
	// handle the 'Show/Hide Users' link

	toggleUserList: function(tab, show)
	{
		if (tab.get('type') != 'chan') return;
		// bail from netwindow tabs, this causes (css) problems

		if (show)
		{
			tab.set({hide_userlist: true});
			cookieData[tab.get('name').toLowerCase() + ':userlist'] = true;

			$('a#hide-users-link').text('Show Users');
			tab.$list.width(0);
			tab.$msgs.width(fullContentWidth - borderPadding).addClass('wmsg_container').removeClass('msg_container');
			tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - borderPadding);
		}
		else
		{
			tab.set({hide_userlist: false});
			delete cookieData[tab.get('name').toLowerCase() + ':userlist'];

			$('a#hide-users-link').text('Hide Users');
			tab.$msgs.width(fullContentWidth - borderPadding - userListWidth).addClass('msg_container').removeClass('wmsg_container');
			tab.$list.width(userListWidth);
			tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - borderPadding - userListWidth);
		}

		tab.get('view').reDraw(true);
		// wait till the width has adjusted

		(JSON.stringify(cookieData) != '{}') ? $.cookie('tab-options', JSON.stringify(cookieData)) : $.cookie('tab-options', null);
	},
	// toggle show/hide users

	hideExtraClick: function(e)
	{
		if ($(e.currentTarget).text() == 'Hide Joins/Parts')
			this.toggleExtra(tabCollections.getByCid(selectedTab), true);
		else
			this.toggleExtra(tabCollections.getByCid(selectedTab), false);

		e.preventDefault();
	},
	// handle the 'Show/Hide Joins' link

	toggleExtra: function(tab, show)
	{
		if (tab.get('type') != 'chan') return;
		// bail from netwindow tabs, this causes (css) problems

		if (show)
		{
			tab.set({hide_joinsparts: true});
			cookieData[tab.get('name').toLowerCase() + ':hideextra'] = true;

			$('a#hide-extra-link').text('Show Joins/Parts');
			tab.$msgs.find('div.row[data-type=join], div.row[data-type=part], div.row[data-type=quit], div.row[data-type=nick]').hide();
		}
		else
		{
			tab.set({hide_joinsparts: false});
			delete cookieData[tab.get('name').toLowerCase() + ':hideextra'];
			
			$('a#hide-extra-link').text('Hide Joins/Parts');
			tab.$msgs.find('div.row[data-type=join], div.row[data-type=part], div.row[data-type=quit], div.row[data-type=nick]').show();
		}

		(JSON.stringify(cookieData) != '{}') ? $.cookie('tab-options', JSON.stringify(cookieData)) : $.cookie('tab-options', null);
	},
	// toggle extra

	viewLogsClick: function(e)
	{
		if (tabCollections.getByCid(selectedTab).get('type') != 'chan') return;
		// bail from netwindow tabs, this causes (css) problems

		return;
	},
	// view logs link

	leaveChanClick: function(e)
	{
		if (tabCollections.getByCid(selectedTab).get('type') == 'window') return;
		// bail from netwindow tabs, this also causes problems

		if ($(e.currentTarget).text() == 'Leave')
			actions.destroyWindow(selectedTab, true);
		else if ($(e.currentTarget).text() == 'Close')
			actions.destroyWindow(selectedTab, true);
		// perform the close

		e.preventDefault();
	},
	// handle the 'Leave' link

	connectClick: function(e)
	{
		if ($(e.currentTarget).attr('id') == 'close-link' && $(e.currentTarget).text() == 'Close')
		{
			actions.destroyWindow(selectedTab, true);
			return e.preventDefault();
		}
		// destroy a tab if its marked as close

		if (userInfo.networks[selectedNet].status == 'connected' || userInfo.networks[selectedNet].status == 'connecting')
			client.socket.emit('disconnectNetwork', {network: selectedNet});
		else
			client.socket.emit('connectNetwork', {network: selectedNet});
			
		e.preventDefault();
	},
	// handle the 'Connect/Disconnect' links

	changeNickClick: function(e)
	{
		main.chat.setValue('/nick ');
		main.$chat.focus();

		e.preventDefault();
	}
	// handle change nickname click
});

$(document).ready(function() {
	main = new MainView({el: $('body')});
});