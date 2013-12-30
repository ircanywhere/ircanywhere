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
		title: this.data.title,
		modes: (this.data.type == 'channel') ? '+' + this.data.document.modes : '',
		desc: (this.data.type == 'channel') ? this.data.document.topic.topic : this.data.title
	});

	console.log(Session.get('topicBarData'));
};

Template.tab.isSelected = function() {
	return (this.selected) ? 'show' : 'hide';
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

Template.tabContent.isChannel = function() {
	return (this.type == 'channel');
};
// ----------------------------