Template.sidebar.networks = function() {
	tabEngine.networks.rewind();
	return tabEngine.networks;
};

Template.network.isSelected = function(tab) {
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