// ----------------------------
// Template.app
// - main application template

Template.app.rendered = function() {
	$('body').on('keydown', function(e) {
		$('input.command-field:visible').focus();
	});
}
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
// ----------------------------