UserCollection = Backbone.Collection.extend({

	model: UserModel,
	heads: [
		{
			name: 'Operators',
			type: 'op'
		},
		{
			name: 'Half operators',
			type: 'halfop'
		},
		{
			name: 'Voiced',
			type: 'voice'
		},
		{
			name: 'Users',
			type: 'user'
		}
	],

	initialize: function(options)
	{
		this.tab = options.tab;
		this.el = options.view.userList.el;
		
		this.on('add', function(object) {
			this.addLIElement(object);
		});

		this.on('remove', function(object) {
			this.removeLIElement(object);
		});
	},

	_comparator: function(o)
	{
		return o.get('sortBy');
	},

	sorter: function()
	{
		this.comparator = this._comparator;
		this.sort().sort();
		this.comparator = undefined;
	},

	addLIElement: function(object)
	{
		this.sorter();
		
		var me = $(this.el),
			el = $(object.$el),
			enterAt = this.indexOf(object) + 1;
		// find out where to enter it in the <ul>

		if (this.at(enterAt) != undefined)
			el.insertBefore(this.at(enterAt).el);
		else if (this.at(enterAt + 1) != undefined)
			el.insertBefore(this.at(enterAt + 1).el);
		else
			me.find('ul').append(el);
		// determine where we enter it at.

		me.find('div.members-title span.right').text(this.length);

		this.renderHeaders(me);
	},

	removeLIElement: function(object)
	{
		var me = $(this.el),
			el = $(object.el);

		el.empty().remove();
		me.find('div.members-title span.right').text(this.length);
		
		this.renderHeaders(me);
	},

	renderHeaders: function(me)
	{
		for (var head in this.heads)
		{
			var name = this.heads[head].name,
				type = this.heads[head].type,
				first = me.find('ul li[data-type=' + type + ']:first'),
				head = me.find('ul li[data-type=' + type + '-head]'),
				num = me.find('ul li[data-type=' + type + ']').length,
				element = $('<li data-type="' + type + '-head" class="clear"><span class="left">' + name + '</span><span class="right">' + num + '</span></li>');
			
			$.when(head.remove()).done(function()
			{
				element.insertBefore(first);
			});
		}
		// loop through them, construct and add them
	},

	render: function()
	{
		var _this = this,
			htmlBuffer = '',
			me = $(_this.el);

		_this.sorter();
		_this.each(function(model) {
			if (model.$el != undefined)
				htmlBuffer += model.$el;
		});

		me.find('ul').empty().remove();
		me.find('div.members-title span.right').text(_this.length);
		$.when(me.append('<ul>' + htmlBuffer + '</ul>')).done(function()
		{
			_this.renderHeaders(me);
			// render headings
		});
		
		_this.tab.set({loading: false});
		
		return _this;
	}
});