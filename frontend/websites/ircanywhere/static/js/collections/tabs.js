TabCollection = Backbone.Collection.extend({

	model: TabModel,

	/*
	 * changeTitleBar
	 *
	 * updates the title bar with new information
	 */
	changeTopicBar: function(chan, modes, tabId, topic)
	{
		$('.topbar .chan-title').text(chan);
		$('.topbar .chan-modes').text(modes);
		$('.topbar .chan-desc').empty().show().html(topic);
		$('.topbar .chan-desc').attr('data-id', tabId);
	},

	/*
	 * resetTopicBar
	 *
	 * reset / resize the topic bar
	 */
	resetTopicBar: function(tab)
	{
		if (tab.get('type') != 'window')
		{
			var maxPX = ($(window).width() - ($('.topbar a.brand').width() + 450 + $('.topbar .chan-title').width() + $('.topbar .chan-modes').width())),
				topic = (tab.get('topic') == null) ? '' : tab.get('topic'),
				modes = (tab.get('modes') == null) ? '' : tab.get('modes'),
				chars = modes.length + tab.get('name').length + topic.length;
			
			this.changeTopicBar(tab.get('name'), modes.split(' ')[0], tab.get('id'), IRCParser.exec(topic, userInfo.networks[tab.get('network')]));
			// calculate how much space we got for the topic and channel name?

			tab.$msgs.find('div.overlay-bar').empty().html('<span class="channel-name">' + tab.get('name') + '</span> <span class="modes">' + modes + '</span> <span class="topic">' + IRCParser.exec(topic, userInfo.networks[tab.get('network')]) + '</span>');
		}
	}
});

var tabCollections = new TabCollection([]);