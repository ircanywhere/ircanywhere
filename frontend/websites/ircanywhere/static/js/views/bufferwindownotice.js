BufferWindowNoticeView = Backbone.Model.extend({

	tagName: 'div',
	className: 'row',

	initialize: function(options)
	{
		this.options = options;
		this.tabId = this.options.tabId;
		this.msg = this.options.msg;
		this.tab = tabCollections.getByCid(this.tabId);
		this.time = (this.options.time == null) ? new Date() : new Date(this.options.time);
		// set some variables

		this._id = $.fastEncode(Math.floor((Math.random()*100)+1) + this.msg + this.time + Math.floor((Math.random()*100)+1)).toString();
		this._id = (this._id.substr(0, 1) == '-') ? this._id : '-' + this._id;
		// generate a random id that we use instead of the buffer id's, which are md5 hashes, although we just sack it off
		// we make sure it starts with a - so we can move to the next one when we're asking for more buffers from the backend

		this.render();
		this.housekeep();
	},

	housekeep: function()
	{
		this.tab.get('view').cleanup(false, false, 0, true);
	},

	render: function()
	{
		this.html = '<p>' + this.msg + '</p>';
		this.$el = $.tmpl('windowNoticeRow', {
			id: this._id,
			message: this.html,
			date: this.time
		});
		// setup template

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

			if (this.tab.$msgs.find('div.mcontainer > div.row:last div.divider').length > 0)
	        {
	        	if (this.tab.$msgs.find('div.mcontainer > div.row:last div.divider p:last')[0].outerHTML != this.html)
	        		this.tab.$msgs.find('div.mcontainer > div.row div.divider:last').append(this.html);
	        }
	        else
	        {
	        	$.when(this.$el.insertAfter(selector), {el: selector}).then(function(el, obj)
				{
					if (markup != null)
						markup.insertBefore(obj.el);
				});
			}
		}
        // need to insert a divider etc.
	}
});