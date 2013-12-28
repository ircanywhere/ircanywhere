// ----------------------------
// Template.tabs
// - the tab windows

Template.tabs.tabs = function() {
	return Application.getNetworks();
};
// ----------------------------

// ----------------------------
// Template.tab
// - everything outside of the .messages

Template.tab.isSelected = function(tab) {
	return (tab.selected) ? 'show' : 'hide';
};

Template.tab.preserve({
	'.messages': function(node) {
		return node.id;
	}
});
// ----------------------------

// ----------------------------
// Template.tabContent
// - everything inside .messages

// ----------------------------