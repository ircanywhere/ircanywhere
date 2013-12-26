Template.tabs.tabs = function() {
	return TabCollections.find({});
};

Template.tab.isSelected = function(tab) {
	return (tab.selected) ? 'show' : 'hide';
};