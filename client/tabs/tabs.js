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

Template.tab.rendered = function() {
	if (!this.data.selected) {
		return false;
	}
	// bail on unselected tabs

	Session.set('topicBarData', {
		key: this.data.key,
		title: this.data.title,
		modes: (this.data.type == 'channel') ? '+' + this.data.document.modes : '',
		desc: (this.data.type == 'channel') ? this.data.document.topic.topic : this.data.title
	});
};

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