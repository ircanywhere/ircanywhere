App.TitlebarView = Ember.View.extend({
	templateName: 'titlebar',
	classNames: 'topbar clear',

	mouseEnter: function(e) {
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