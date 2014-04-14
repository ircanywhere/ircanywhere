App.ApplicationView = Ember.View.extend({
	didInsertElement: function() {
		var self = this,
			doc = this.$();

		function getSize() {
			App.set('size', Ember.$('#breakpoints div:visible').first().data('size'));
		}

		Ember.$(window).resize(getSize());

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
	}
});