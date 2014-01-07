// ----------------------------
// Template.app
// - main application template

Template.app.rendered = function() {
	$('body').on('keydown', function() {
		$('input.command-field:visible').focus();
	});
};

Template.app.titleInfo = function() {
	var selected = Session.get('selectedTab');

	if (selected == undefined) {
		return {title: '', modes: '', desc: ''};
	}
	// undefined tab

	var doc = Tabs.findOne({_id: selected._id}, {
		transform: function(doc) {
			if (doc.type == 'network') {
				return {
					key: selected._id,
					title: selected.target,
					modes: '',
					desc: selected.url,
					network: selected.target
				};
			} else if (doc.type == 'channel') {
				return {
					key: doc._id,
					title: doc.target,
					modes: '+' + doc.modes,
					desc: (doc.topic !== undefined) ? doc.topic.topic : '',
					network: Networks.findOne({_id: doc.network}).name
				};
			}
		}
	});
	// we're looking for a channel, transform it so it looks the same
	
	return doc;
};

Template.app.events({
	'click .dropdown-toggle': function(e, t) {
		e.preventDefault();
		$('.dropdown-menu').toggle();
		return false;
	},

	'click #set-topic-link': function(e, t) {
		e.preventDefault();
		$('input.command-field:visible').val('/topic ').focus();
		return false;
	},

	'click #hide-users-link': function(e, t) {
		e.preventDefault();
		return false;
	},

	'click #hide-extra-link': function(e, t) {
		e.preventDefault();
		return false;
	},

	'click #leave-chan-link': function(e, t) {
		e.preventDefault();
		return false;
	},

	'click #connect-link': function(e, t) {
		e.preventDefault();
		return false;
	}
});
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
	return Tabs.find({});
};
// ----------------------------

// ----------------------------
// Template.network
// - the individual network list on the sidebar

Template.network.getURL = function() {
	var split = this.url.split('/');

	return (split.length == 1) ? split[0] : split[0] + '/' + encodeURIComponent(split[1]);
};

Template.network.isSelected = function() {
	if (!this.selected) {
		return '';
	} else {
		Session.set('selectedTab', this);
		return 'selected';
	}
};

Template.network.isChild = function() {
	return (this.type == 'network') ? '' : 'child';
};

Template.network.getClass = function() {
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