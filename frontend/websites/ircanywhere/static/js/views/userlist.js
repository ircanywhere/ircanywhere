var UserListView = Backbone.View.extend({

	initialize: function(options)
	{
		this.ulId = options.ulId;
		this.tabId = options.tabId;
		this.tab = options.tab;
		this.el = 'div#list-' + this.tabId + ' div.content';
	},

	create: function()
	{
		$(this.el).prepend('<div class="members-title clear"><span class="left">Users</span><span class="right"></span></div><ul></ul>');
	}
});