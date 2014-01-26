App.OverlaybarView = Ember.View.extend({
	templateName: 'overlaybar',
	classNames: 'overlay-bar',

	isChannel: function() {
		return (this.get('context.selectedTab.type') === 'channel');
	}.property('context.selectedTab.type'),

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