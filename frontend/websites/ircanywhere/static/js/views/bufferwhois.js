BufferWhoisView = Backbone.Model.extend({

	initialize: function(options)
	{
		this.network = options.network;
		this.user = options.user;
		this.tabId = mem[this.network + '-window'];
		this.tab = tabCollections.getByCid(this.tabId);
	},

	render: function(data)
	{
		for (var line in data)
			parser.other(this.tabId, '', '[' + this.user + '] ' + data[line], 'motd', {prepend: false, noDate: true});
		// insert whois info
	}
});