App.ApplicationView = Ember.View.extend({
	didInsertElement: function() {
		var doc = this.$();

		doc.touchwipe({
			wipeLeft: function() {
				if (Ember.$('.sidebar').hasClass('mobile')) {
					Ember.$('.sidebar').removeClass('mobile');
				} else {
					Ember.$('.userlist').addClass('mobile');
				}
			},
			wipeRight: function() {
				if (Ember.$('.userlist').hasClass('mobile')) {
					Ember.$('.userlist').removeClass('mobile');
				} else {
					Ember.$('.sidebar').addClass('mobile');
				}
			},
			preventDefaultEvents: false
		});
	}
});