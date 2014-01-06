// ----------------------------
// Template.tabs
// - the tab windows

Template.tabs.tabs = function() {
	return Tabs.find({});
};
// ----------------------------

// ----------------------------
// Template.tab
// - everything outside of the .messages

Template.tab.isSelected = function() {
	return (this.selected) ? 'show' : 'hide';
};

Template.tab.isChannel = function() {
	return (this.type == 'channel');
};

/*Template.tab.events({
	'mouseenter .overlay-bar': Application.mouseEnter,
	'mouseleave .overlay-bar': Application.mouseLeave
});*/
// ----------------------------