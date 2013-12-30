// ----------------------------
// Template.app
// - main application template

Template.app.rendered = function() {
	$('body').on('keydown', function(e) {
		$('input.command-field:visible').focus();
	});
};

Template.app.titleInfo = function() {
	return Session.get('topicBarData');
};
// ----------------------------

// ----------------------------
// Template.titlebar
// - the titlebar template and its content (dropdown link, topic bar)

Template.titlebar.events({
	'mouseenter .topic-wrap': function(e, t) {
		console.log('do something');
	}
});
// ----------------------------

// ----------------------------
// Template.sidebar
// - the sidebar template, currently just includes the dynamic network list

Template.sidebar.networks = function() {
	return Application.getNetworks();
};
// ----------------------------

// ----------------------------
// Template.network
// - the individual network list on the sidebar

Template.network.isSelected = function(tab) {
	return (this.selected) ? 'selected' : '';
};

Template.network.getClass = function(tab) {
	if (this.type == 'network' && this.status == 'connecting') {
		return 'net-loader';
	} else if (this.type == 'network' && this.status !== 'connecting') {
		return 'net-loaded';
	} else if (this.type == 'channel' || this.type == 'query') {
		return ''
	} else {
		return 'net-loaded';
	}
};
// ----------------------------