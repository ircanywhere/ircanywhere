App.TitlebarView = Ember.View.extend({
	templateName: 'titlebar',
	classNames: 'topbar',

	didInsertElement: function() {
		Ember.$(document).on('click.TitlebarView', this.documentClick.bind(this));
		this.$('ul#options-menu li > a, ul#options-menu li > ul').on('mouseenter', this.mouseLeave);
		// setup dynamic events for individual elements
	},

	willDestroyElement: function() {
		Ember.$(document).off('click.TitlebarView');
		this.$('ul#options-menu li > a').off('mouseenter', this.mouseLeave);
		// bring the events down to prevent duplicates which could lead to leaks
	},

	documentClick: function(e) {
		if (this.get('controller.showMenu')) {
			var elem = Ember.$(e.target);
			if (elem.closest('.dropdown-toggle').length) {
				return false;
			}
			// don't handle clicks if they're clicking the dropdown button

			this.get('controller').send('toggleProperty');
		}
	},

	mouseEnter: function() {
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

	mouseLeave: function() {
		App.set('timeout', setTimeout(function() {
			Ember.$('.overlay-bar').slideUp('fast');
		}, 500));
		// create a timer to slide the overlay bar up

		clearTimeout(App.get('timein'));
	}
});