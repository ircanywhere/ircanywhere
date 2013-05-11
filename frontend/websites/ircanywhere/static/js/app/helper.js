var Helper = {
	
	collapseableTypes: [
		'collapse',
		'join',
		'part',
		'nick',
		'quit',
		'mode',
		'topic',
		'kick'
	],

	isChannel: function(network, channel)
	{
		var firstChar = (channel == '') ? '' : channel.charAt(0),
			types = (network.extra == undefined || network.extra.channelTypes == undefined) ? ['#'] : network.extra.channelTypes;
			types = (typeof types == 'string') ? types.split('') : types;
		// if we can't find any types or it isnt an array we reset it

		if (types.indexOf(firstChar) > -1)
			return true;
		// if the channel is a valid type then return true

		return false;
	},

	encodeChannel: function(channel)
	{
		return channel
				.replace('#', '%23')
				.replace('&', '%26')
				.replace('+', '%2B')
				.replace('!', '%21');
	},

	decodeChannel: function(channel)
	{
		return channel
				.replace('%23', '#')
				.replace('%26', '&')
				.replace('%2B', '+')
				.replace('%21', '!');
	},

	generateUserLink: function(network, nick, ident, hostname, prefix, away, showPrefix)
	{
		if (prefix == 'Z' || prefix == '')
			prefixClass = '';
		else if (prefix == '+')
			prefixClass = ' voice';
		else if (prefix == '%')
			prefixClass = ' halfop';
		else 
			prefixClass = ' op';
		// setup a different colour for different prefixes :3

		var away = (away == undefined) ? true : away,
			showPrefix = (showPrefix == undefined) ? true : showPrefix,
			awayClass = (away) ? ' class="away clear"' : ' class="clear"',
			prefixIcon = (prefix == 'Z' || prefix == '') ? '&nbsp;' : prefix,
			prefixSpan = (showPrefix) ? '<span class="prefix' + prefixClass + '">' + prefixIcon + '</span>' : '';

		return '<a href="#!/' + userInfo.networks[network].url + '/' + nick + '" rel="user-link" data-nick="' + nick + '"  data-prefix="' + prefixIcon + '" data-ident="' + ident + '" data-hostname="' + hostname + '"' + awayClass + '>' + prefixSpan + '<span class="name">' + nick + '</span></a></li>';
		// return the element
	},

	generateCollapsedHeading: function(tab, head, type, el)
	{
		var prefixes = {
				'join': '&rarr;',
				'part': '&larr;',
				'nick': '&dash;',
				'quit': '&larr;',
				'mode': '&dash;',
				'topic': '&dash;',
				'kick': '&larr;'
			},
			suffixes = {
				'join': 'has joined',
				'part': 'has left',
				'quit': 'has quit'
			},
			prefix = prefixes[type],
			userLink = el.find('a:first-child'),
			collapsed = tab.$msgs.find('div.collapsed:last');
		// we just get passed in el which we extract everything we need from it.
		// first off we'll see if the head already has an element for this type

		if (type == 'mode' || type == 'nick' || type == 'topic')
		{
			element = $('<span class="ht ' + type + '">' + el.find('.event').html() + '</span>');

			head.append(element);
		}
		else if ((type != 'mode' && type != 'nick' && type != 'topic') && userLink[0] != undefined)
		{
			var suffix = (suffixes[type] == undefined) ? '' : ' ' + suffixes[type],
				element = $('<span class="ht ' + type + '">' + prefix + ' ' + userLink[0].outerHTML + suffix + '</span>');

			head.append(element);
		}
	},

	reOrganiseChannelEvents: function(tab, time, me)
	{
		var _this = this,
			prev = me.prev(),
			next = me.next(),
			parent = me.parent();

		if (tab.get('type') != 'chan' || me.attr('data-type') == 'collapse')
			return;

		function callback(el)
		{
			if (el !== undefined)
			{
				if (client.settings.timestamp_format == 0)
					el.find('span.time').text(el.find('span.time').attr('data-format-1'));
				else
					el.find('span.time').text(el.find('span.time').attr('data-format-2'));
			}

			if (!parent.hasClass('collapsed') && _this.collapseableTypes.indexOf(me.attr('data-type')) > -1)
			{
				me.prevAll('div.collapsed:first').append(me);
				// lastly we move the me element into collapsed, so we can hide it

				_this.generateCollapsedHeading(tab, me.parent().prevAll('div.collapsed-head:first').find('span.event'), me.attr('data-type'), me);
				// firstly we start populating the head based on what we've just moved
			}
		};
		
		if (_this.collapseableTypes.indexOf(prev.attr('data-type')) == -1 && _this.collapseableTypes.indexOf(me.attr('data-type')) > -1)
		{
			if (_this.collapseableTypes.indexOf(next.attr('data-type')) == -1)
				return;

			el = $.tmpl('collapsedHeadingRow', {
				message: '',
				time_f1: $.generateTime(time, false),
				time_f2: $.generateTimestamp(time),
				date: time
			});
			
			el.find('.column2').width(tab.$msgs.width() - 120);
			// compile an object so we can render a template with $.tmpl()
			// also resize our new .$el object so it fits

			$.when(el.insertBefore(me)).done(callback.bind(el));
		}
		// add the collapsed-head which in turn will just be a normal row
		// and the collapsed div for all the collapsed joins/parts/mode changes etc.
		else
		{
			callback();
		}
	},

	insertDateDividers: function(tab)
	{
		var _this = this;

		tab.$msgs.find('div.mcontainer div.row[data-type=date-divider]').remove();
		tab.$msgs.find('div.mcontainer div.row').each(function()
		{
			var me = $(this),
				prev = me.prev(),
				time = new Date(me.attr('data-time')),
				markup = $.dateTimeBar(tab, time, true);
			// determine if we have date markup

			if (markup != null)
			{
				if (prev.attr('data-type') == 'collapse' && prev.children().length == 1)
				{
					prev.prev().remove();
					prev.children().unwrap();
				}
				// remove any previous elements broken up by the datebar

				$.when(markup.insertBefore(me)).done(_this.reOrganiseChannelEvents(tab, time, me));
			}
			else
			{
				_this.reOrganiseChannelEvents(tab, time, me);
			}

			if (prev.attr('data-type') == 'window-notice' && me.attr('data-type') == 'window-notice')
			{
				var html = me.find('div.divider p')[0].outerHTML,
					pHtml = prev.find('div.divider p')[0].outerHTML;
					prev.find('div.divider').empty().html(html + pHtml);

				prev.attr('data-id', this._id);
				me.empty().remove();
			}

			if (client.settings.timestamp_format == 0)
				me.find('span.time').text(me.find('span.time').attr('data-format-1'));
			else
				me.find('span.time').text(me.find('span.time').attr('data-format-2'));
		});
	}
};