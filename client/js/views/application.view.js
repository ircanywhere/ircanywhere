App.ApplicationView = Ember.View.extend({
	didInsertElement: function() {
		var self = this,
			doc = this.$();

		function getSize() {
			App.set('size', Ember.$('#breakpoints div:visible').first().data('size'));
		}

		Ember.$(window).resize(getSize());

		doc.touchwipe({
			wipeLeft: function() {
				/*Ember.$('.container').addClass('mobile');
				Ember.$('.sidebar').addClass('mobile');*/
			},
			wipeRight: function() {
				/*Ember.$('.container').removeClass('mobile');
				Ember.$('.sidebar').removeClass('mobile');*/
			},
			min_move_x: 20,
			min_move_y: 20,
			preventDefaultEvents: true
		});
	}
});