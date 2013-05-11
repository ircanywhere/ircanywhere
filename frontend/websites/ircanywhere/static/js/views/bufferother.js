BufferOtherView = Backbone.Model.extend({

	tagName: 'div',
	className: 'row',
	types: [
		'join',
		'part',
		'nick',
		'quit',
		'mode',
		'topic',
		'kick'
	],

	initialize: function(options)
	{
		this.options = options;
		this.tabId = this.options.tabId;
		this._id = this.options._id;
		this.chan = this.options.chan;
		this.msg = this.options.msg;
		this.type = this.options.type;
		this.tab = tabCollections.getByCid(this.tabId);
		this.network = (this.tab == undefined) ? '' : this.tab.get('network');
		this.time = (options.time == undefined) ? new Date() : new Date(options.time);
		this.extraCss = (this.type != 'motd') ? ' otherRow' : ' motdRow';
		this.extraCss = (this.tab.get('hide_joinsparts') == true) ? this.extraCss + ' hide' : this.extraCss;
		this.cssType = (this.types.indexOf(this.type) >= 0) ? 'event' : this.type;

		if (this.tab == undefined || this.msg == '' || this.msg == undefined)
			return;
		// bail.

		this.housekeep();
	},

	housekeep: function()
	{
		if (this.type != 'other')
		{
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
		}
		else if (this.type == 'other' && this.chan == 'links')
		{
			var data = this.msg.split(' ').splice(1);
			this.server = '<strong>' + data[0] + '</strong> <- ' + data[1],
			this.descData = data.splice(3);
			this.desc = (this.descData.join(' ') == '') ? '&nbsp;' :this. descData.join(' ');
			
			this.renderLinks();
		}
	},

	cont: function()
	{
		this.renderNormal();
	},

	renderNormal: function()
	{
		var _this = this;

		this.$el = $.tmpl('otherRow', {
			id: this._id,
			cssClass: this.extraCss,
			type: this.type,
			messageCssClass: this.cssType,
			message: this.msg,
			time_f1: $.generateTime(this.time, false),
			time_f2: $.generateTimestamp(this.time, false),
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
			var markup = (this.options.noDate) ? null : $.dateTimeBar(this.tab, this.time, this.options.prepend),
				selector = this.tab.$msgs.find('div.mcontainer > div.row:last');

			$.when(this.$el.insertAfter(selector), {el: selector}).then(function(el, obj)
			{
				if (markup != null)
					markup.insertBefore(obj.el);
				// insert a new time bar if need be

				Helper.reOrganiseChannelEvents(_this.tab, _this.time, obj.el.next());
				// now determine whether this needs to be collapsed and moved into the new section

				if (client.settings.timestamp_format == 0)
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-1'));
				else
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-2'));
				
			});
		}
		// where do we insert it?

		if (!this.options.prepend)
			this.tab.get('view').cleanup(this.options.prepend, this.options.last).removeLast();
	},

	renderLinks: function()
	{
		this.$el = $('<tr><td class="column4">' + this.server + '</td><td class="column5">' + this.desc + '</td></tr>');
		this.tab.$table.find('tbody').append(this.$el);
		// add the data row

		this.tab.$msgs.scrollTop(0);
	}
});