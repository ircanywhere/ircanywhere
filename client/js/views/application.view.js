App.ApplicationView = Ember.View.extend({
	didInsertElement: function() {
		var self = this,
			doc = this.$();

		if (doc.outerWidth() <= 1024) {
			App.set('isDesktop', false);
		} else {
			App.set('isDesktop', true);
		}

		doc.swipe({
			swipeRight: function(event, direction, distance, duration, fingerCount) {
				/*Ember.$('.container').removeClass('mobile');
				Ember.$('.sidebar').removeClass('mobile');*/
			},

			swipeLeft: function(event, direction, distance, duration, fingerCount) {
				/*Ember.$('.container').addClass('mobile');
				Ember.$('.sidebar').addClass('mobile');*/
			}
		});
	},

	determineOS: function() {
		/*if (App.get('isDesktop')) {
			this.$().removeClass('mobile');
		} else {
			this.$().addClass('mobile');
		}*/
	}.observes('App.isDesktop')
});