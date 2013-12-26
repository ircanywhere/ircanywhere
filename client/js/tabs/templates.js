Template.tabs.tabs = function() {
	tabEngine.networks.rewind();
	return tabEngine.networks;
};

Template.tab.isSelected = function(tab) {
	return (tab.selected) ? 'show' : 'hide';
};

Template.tab.getNickname = function(network) {
	return Networks.findOne({_id: network}, {fields: {'nick': 1}}).nick;
}