tabEngine = Object.create(Tabs);

Template.sidebar.networks = function() {
	tabEngine.networks.rewind();
	return tabEngine.networks;
};

Template.network.isSelected = function(tab) {
	if (tab.selected && window.document.location != tab.url) {
		var split = tab.url.split('/');
		Router.go('tab', {url: split[0], network: split[1] || undefined});
	}
	// re-route the user to the selected tab

	return (tab.selected) ? 'selected' : '';
};

Template.network.getClass = function(tab) {
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