// ----------------------------
// Template.app
// - main application template

Template.app.rendered = function() {
	$('body').on('keydown', function(e) {
		$('input.command-field:visible').focus();
	});
};

Template.app.titleInfo = function() {
	var selected = Session.get('selectedTab');

	if (selected == undefined) {
		//Application.reRoute();
		// the router may not be at a tab, ie "/"
		// we don't really want this, lets move it

		return {title: '', modes: '', desc: ''};
	}
	// undefined tab

	console.log(selected);

	if (selected.type == 'network') {
		var doc = {
			title: selected.title,
			modes: '',
			desc: selected.url
		};
	} else if (selected.type == 'channel') {
		var doc = Channels.findOne({_id: selected.key}, {
			transform: function(doc) {
				return {
					title: doc.channel,
					modes: '+' + doc.modes,
					desc: doc.topic.topic
				};
			}
		});
		// we're looking for a channel, transform it so it looks the same
	} else {
		var doc = Tabs.findOne({_id: selected.key});
	}
	// get the document

	return doc;
};
// ----------------------------

// ----------------------------
// Template.titlebar
// - the titlebar template and its content (dropdown link, topic bar)

Template.titlebar.events({
	'mouseenter .topic-wrap': Application.mouseEnter,
	'mouseleave .topic-wrap': Application.mouseLeave
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
	if (!this.selected) {
		return '';
	} else {
		Session.set('selectedTab', this);
		return 'selected';
	}
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