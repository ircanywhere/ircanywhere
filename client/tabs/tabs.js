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

Template.tab.isSelected = function() {
	return (this.selected) ? 'show' : 'hide';
};
// ----------------------------

// ----------------------------
// Template.tabContent
// - everything inside .messages

Template.tabContent.isChannel = function() {
	return (this.type == 'channel');
};

Template.tabContent.preserve({
	'.overlay-bar': function(node) {
		return node.id;
	},

	'.top-message-bar': function(node) {
		return node.id;
	},

	'.backlog': function(node) {
		return node.id;
	}
});

Template.tabContent.events({
	'mouseenter .overlay-bar': Application.mouseEnter,
	'mouseleave .overlay-bar': Application.mouseLeave
});
// ----------------------------