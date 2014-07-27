App.OverlaybarView = Ember.View.extend({
	templateName: 'overlaybar',
	classNames: 'overlay-bar',

	isChannel: function() {
		return (this.get('context.selectedTab.type') === 'channel');
	}.property('context.selectedTab.type').cacheable(),

	mouseEnter: function() {
		if (this.get('context.selectedTab.type') !== 'channel') {
			return false;
		} else if (this.get('context.selectedTab.type.topic', '') === '') {
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