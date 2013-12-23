application = Object.create(Application);

Template.app.networks = function() {
	return Networks.find({}, {fields: {
		'_id': 1,
		'internal.tabs': 1,
		'internal.url': 1,
		'internal.status': 1,
		'name': 1
	}, transform: function(doc) {
		var tabs = [];
		for (var title in doc.internal.tabs) {
			var tab = doc.internal.tabs[title];
			tab.status = doc.internal.status;
			tab.url = (tab.type == 'network') ? doc.internal.url : doc.internal.url + '/' + tab.target;
			tabs.push(tab);
		};
		// re-construct tabs, because #each in Spark doesn't like objects

		doc.tabs = tabs;
		doc.url = doc.internal.url;
		delete doc.internal;
		// reorganise and clean up the document

		return doc;
	}});
};

Template.app.isSelected = function(tab) {
	if (tab.selected && window.document.location != tab.url) {
		var split = tab.url.split('/');
		Router.go('tab', {url: split[0], network: split[1] || undefined});
	}

	return (tab.selected) ? 'selected' : '';
};

Template.app.getClass = function(tab) {
	if (tab.type == 'network' && tab.status == 'connecting') {
		return 'net-loader';
	} else if (tab.type == 'network' && tab.status !== 'connecting') {
		return 'net-loaded';
	} else if (tab.type == 'channel' || tab.type == 'query') {
		return ''
	} else {
		return 'net-loaded';
	}
};

Template.main.data = function() {
	return ChannelUsers.find();
};

Template.main.events = function() {
	return Events.find();
}

Template.main.event = function(json) {
	return JSON.stringify(json, undefined, 2);
}