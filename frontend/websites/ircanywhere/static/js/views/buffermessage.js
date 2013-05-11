BufferMessageView = Backbone.Model.extend({

	tagName: 'div',
	className: 'row',

	initialize: function(parser, options)
	{
		this.parser = parser;
		this.options = options;
		this._id = this.options._id;
		this.msg = this.options.args.slice(1).join(' ');
		this.privMsg = false;
		this.ctcp = false;
		this.pause = false;
		this.extraRow = '';
		this.action = (/\u0001ACTION(.*?)\u0001/.test(this.msg)) ? true : false;
		this.time = (this.options.time == undefined) ? new Date() : new Date(this.options.time);
		this.options.read = (this.options.read == undefined) ? true : this.options.read;
		this.port = (userInfo.networks[this.options.network].secure) ? '+' + userInfo.networks[this.options.network].port : userInfo.networks[this.options.network].port;

		if (this.msg == undefined || this.msg == '')
			return;
		// empty message, bizarre but we don't continue

		this.housekeep();
	},

	isAction: function()
	{
		if (/^\u0001(?:(?!ACTION).)*\u0001/.test(this.msg))
			return true;
		return false;
	},

	housekeep: function()
	{
		var forcePush = false;

		if (this.isAction())
		{
			this.tabId = mem[this.options.network + '-window'];
			this.tab = tabCollections.getByCid(this.tabId);
			this.nick = '&nbsp;';
			this.ctcp = true;
			this.extraRow = ' otherRow';
			this.command = /\u0001(.*?)\u0001/.exec(this.msg)[0].replace(/\W+/g, '');
			this.msg = 'Recieved a CTCP ' + this.command + ' from ' + this.options.nick;
			// set some variables
		}
		// if it's an ACTION/CTCP we need to determine how to format it

		if (!this.ctcp && Helper.isChannel(userInfo.networks[this.options.network], this.options.args[0]))
		{
			this.tabId = mem[this.options.network + '-chan-' + this.options.args[0].substr(1).toLowerCase()];
			this.tab = tabCollections.getByCid(this.tabId);
			this.nick = this.options.nick;
		}
		else if (!this.ctcp)
		{
			var tabPart = (this.options.self) ? this.options.args[0] : this.options.nick;
			this.tabId = mem[this.options.network + '-query-' + tabPart.toLowerCase()];
			this.tab = tabCollections.getByCid(this.tabId);
			this.nick = this.options.nick;
			this.privMsg = true;

			if (this.tabId == undefined && this.tab == undefined)
			{
				this.tabId = actions.createWindow(this.options.network, tabPart, 'query', {bottomMessageId: this._id, finishedPlayback: false, prependHTML: ''});
				this.tab = tabCollections.getByCid(this.tabId);
				this.pause = true;
				forcePush = true;
			}
			// tab dunt exist? create it.
		}
		// if it's a user, we find out if we've got a query window open for this user
		
		if (this.options.prepend || this.tab.get('finishedPlayback') || forcePush)
		{
			this.cont();
		}
		else
		{
			var backlog = this.tab.get('backLog');
				backlog.push(this);
			this.tab.set({backLog: backlog});
		}
		// only continue if the playback has finished
	},

	cont: function()
	{
		if (this.pause)
			setTimeout(function() { this.render() }.bind(this), 300);
		// enough time for the message to be inserted prior to the user having a look at it
		else
			this.render();

		this.tab.set({privmsgs: this.tab.get('privmsgs') + 1});
		// some housekeeping ie setting variables

		var condition1 = (this.tab.get('type') == 'query' && !this.options.self),
			condition2 = (this.options.highlight && !this.options.prepend),
			condition3 = (!window.isActive || this.tab.cid != selectedTab);

		if ((condition1 || condition2) && condition3 && !this.options.read)
			this.tab.get('view').handleHighlight(this.options, this.msg);
		// again final check for highlights, here we display a desktop notification
		// notice regardless of the fact a highlight is always a highlight, we go through other checks to determine if the user needs to know about it (for example it could be a backlog highlight)
	},

	render: function()
	{
		var _this = this,
			user = this.tab.get('ulCollection').filter(function(model) { return model.get('user') == this.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(this.options.network, this.nick, this.options.user, this.options.host, this.options.userPrefix, false, true) : user[0].userLink(true),
			template = (this.action) ? 'messageRowAction' : 'messageRow';
		// pretty up the nick, with prefixes and such
		// (network, nick, hostname, prefix)

		this.$el = $.tmpl(template, {
			cssClass: this.extraRow,
			id: this._id,
			read: this.options.read,
			highlight: this.options.highlight,
			userLink: userLink,
			parsedMessage: IRCParser.exec(this.msg.replace(/\u0001ACTION(.*?)\u0001/, '$1'), userInfo.networks[this.options.network]),
			time_f1: $.generateTime(this.time, false),
			time_f2: $.generateTimestamp(this.time),
			self: this.options.self,
			date: this.time
		});

		this.$el.find('.column2').width(this.tab.$msgs.width() - 120);
		// compile an object so we can render a template with $.tmpl()
		// also resize our new .$el object so it fits

		if (this.options.prepend)
		{
			var prependHTML = this.tab.get('prependHTML'),
				selector = this.tab.$msgs.find('div.mcontainer > div.row[data-type=initial-divider]');
			
			this.tab.set({topEventId: this._id});
			this.tab.set({topMessageId: this._id});

			prependHTML = this.$el[0].outerHTML + prependHTML;
			this.tab.set({prependHTML: prependHTML});

			if (this.options.last)
			{
				var insert = $(prependHTML).insertAfter(selector);
				$.when(insert, {el: selector}).then(Helper.insertDateDividers(_this.tab));
			}
		}
		else
		{
			var markup = $.dateTimeBar(this.tab, this.time, this.options.prepend),
				selector = this.tab.$msgs.find('div.mcontainer > div.row:last');
			// determine if we have date markup

			$.when(this.$el.insertAfter(selector), {el: selector}).then(function(el, obj)
			{
				if (markup != null)
					markup.insertBefore(obj.el);

				this.tab.reCalculateScrollState();
				// do we do recalc scroll state here?

				if (client.settings.timestamp_format == 0)
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-1'));
				else
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-2'));

			}.bind(this));
		}
		// where do we insert it?

		if (!this.options.prepend)
			this.tab.get('view').cleanup(this.options.prepend, this.options.last, 0).removeLast();
	}
});