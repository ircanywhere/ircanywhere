BufferNoticeView = Backbone.Model.extend({

	tagName: 'div',
	className: 'row',

	initialize: function(options)
	{
		this.options = options;
		this._id = this.options._id;
		this.msg = this.options.args.splice(1).join(' ');
		this.time = (this.options.time == undefined) ? new Date() : new Date(this.options.time);
		
		if (this.msg == undefined || this.msg == '')
			return;
		// bail if msg is empty

		this.housekeep();
	},

	housekeep: function()
	{
		if (Helper.isChannel(userInfo.networks[this.options.network], this.options.args[0]))
		{
			this.tabId = mem[this.options.network + '-chan-' + this.options.args[0].substr(1).toLowerCase()];
			this.nick = '-' + this.options.nick + '/' + this.options.args[0] + '-';
			this.cssClass = ' notice';
			this.nick = (this.options.nick == undefined) ? this.options.args[0] : this.nick;
		}
		// first we determine whether its a channel.
		else
		{
			this.nick = (this.options.nick == undefined) ? '-' + this.options.prefix + '-' : '-' + this.options.nick + '-';
			this.nick = (this.msg.substr(0, 3) == '***') ? '' : this.nick;
			this.cssClass = (this.nick == '') ? '' : ' notice';
			this.msg = (this.msg.substr(0, 3) == '***' && this.nick == '') ? this.msg.substr(4) : this.msg;
			this.tabId = (this.options.prepend || selectedNet != this.options.network || this.nick == '') ? mem[this.options.network + '-window'] : selectedTab;
		}

		this.tab = tabCollections.getByCid(this.tabId);

		if (this.options.prepend || this.tab.get('finishedPlayback'))
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
		this.render();
	},

	render: function()
	{
		var _this = this,
			user = this.tab.get('ulCollection').filter(function(model) { return model.get('user') == this.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(this.options.network, this.nick, this.options.user, this.options.host, this.options.userPrefix, false, false) : user[0].userLink(false);
			userLink = (this.nick == '' || this.nick.indexOf('.') >= 0) ? this.nick : userLink;

		this.$el = $.tmpl('noticeRow', {
			id: this._id,
			userLink: userLink,
			parsedMessage: IRCParser.exec(this.msg, userInfo.networks[this.options.network]),
			time_f1: $.generateTime(this.options.time, false),
			time_f2: $.generateTimestamp(this.options.time),
			read: this.options.read,
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

		if (!this.options.prepend)
			this.tab.get('view').cleanup(this.options.prepend, this.options.last).removeLast();
	}
});