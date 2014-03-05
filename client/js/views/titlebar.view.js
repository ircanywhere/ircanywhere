App.TitlebarView = Ember.View.extend({
	templateName: 'titlebar',
	tagName: 'table',
	classNames: 'topbar',

	didInsertElement: function() {
		Ember.$(document).on('click', this.documentClick.bind(this));
		this.$('ul#options-menu li > a, ul#options-menu li > ul').on('mouseenter', this.mouseLeave.bind(this));
		// setup dynamic events for individual elements
	},

	willDestroyElement: function() {
		Ember.$(document).off('click', this.documentClick);
		this.$('ul#options-menu li > a').off('mouseenter', this.mouseLeave);
		// bring the events down to prevent duplicates which could lead to leaks
	},

	documentClick: function(e) {
		if (e.target.className === 'dropdown-toggle' || e.target.className === 'dropdown-menu') {
			return false;
		}
		// don't handle clicks if they're clicking the dropdown button

		if (this.get('controller.showMenu')) {
			this.get('controller').send('toggleProperty');
		}
	},

	mouseEnter: function(e) {
		if (this.get('controller.tab.type') !== 'channel') {
			return false;
		} else if (this.get('controller.tab.desc') === '') {
			return false;
		}
		// only show the dropdown for channels, it's really not needed on other tabs

		App.set('timein', setTimeout(function() {
			Ember.$('.overlay-bar').slideDown('fast');
		}, 500));
		// create a timer to slide the overlay bar down

		clearTimeout(App.get('timeout'));
	},

	mouseLeave: function(e) {
		App.set('timeout', setTimeout(function() {
			Ember.$('.overlay-bar').slideUp('fast');
		}, 500));
		// create a timer to slide the overlay bar up

		clearTimeout(App.get('timein'));
	}
});