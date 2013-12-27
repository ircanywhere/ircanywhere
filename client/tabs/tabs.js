Template.tabs.tabs = function() {
	return Application.getNetworks();
};

Template.tab.isSelected = function(tab) {
	console.log(tab);
	return (tab.selected) ? 'show' : 'hide';
};

Template.tabContent.getNickname = function(network) {
	return Networks.findOne({_id: network}, {fields: {'nick': 1}}).nick;
};

Template.tab.preserve({
	'.messages': function(node) {
		return node.id;
	}
});