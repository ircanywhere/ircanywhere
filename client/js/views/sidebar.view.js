App.SidebarView = Ember.View.extend({
	templateName: 'sidebar',
	classNames: 'sidebar',

	didInsertElement: function() {
		var self = this,
			doc = Ember.$(document);

		if (doc.outerWidth() <= 1024) {
			App.set('isDesktop', false);
		} else {
			App.set('isDesktop', true);
		}

		doc.swipe({
			swipeRight: function(event, direction, distance, duration, fingerCount) {
				Ember.$('.container').removeClass('narrow');
				Ember.$('.sidebar').removeClass('narrow');
			},

			swipeLeft: function(event, direction, distance, duration, fingerCount) {
				Ember.$('.container').addClass('narrow');
				Ember.$('.sidebar').addClass('narrow');
			}
		});
	},

	determineOS: function() {
		if (App.get('isDesktop')) {
			Ember.$('.container').removeClass('narrow');
			Ember.$('.sidebar').removeClass('narrow');
		} else {
			Ember.$('.container').addClass('narrow');
			Ember.$('.sidebar').addClass('narrow');
		}
	}.observes('App.isDesktop')
});