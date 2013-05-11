BufferListView = Backbone.Model.extend({

	initialize: function(options)
	{
		this.tabId = options.tabId;
		this.network = options.network;
		this.list = options.list;
		this.tab = tabCollections.getByCid(this.tabId);

		this.render();
	},

	render: function()
	{
		var htmlBuffer = '';
		for (var item in this.list)
		{
			var data = this.list[item],
				channel = data.name,
				channelUrl = '#!/' + userInfo.networks[selectedNet].url + '/' + encodeURIComponent(channel);
				users = data.users,
				topic = (data.topic == '') ? '&nbsp;' : IRCParser.exec(data.topic, userInfo.networks[this.network]);

			htmlBuffer += '<tr><td class="column1"><a href="' + channelUrl + '" rel="channel-link">' + channel + '</a></td><td class="column2">' + users + '</td><td class="column3">' + topic + '</td></tr>';
			// not sure if it's worth using our Templates class here, as this could be entering max 1 or 2 thousand rows?
			// it needs to be as speedy as possible, and this is the best way for it to be.
		}

		this.tab.$msgs.find('div.mcontainer table tbody').html(htmlBuffer);
		// add the data, we sort it when we recieve the end of list
	}
});