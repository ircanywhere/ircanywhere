App.ModalDialogComponent = Ember.Component.extend({
	didInsertElement: function() {
		var overlay = this.$('.overlay'),
			self = this;

		this.$('.overlay').on('click', function(e) {
			if (e.target.className === 'overlay' && !self.alert) {
				self.close();
			}
		});
		
		this.$('.modal').slideDown('fast');
	},

	willDestroyElement: function() {
		this.$('.overlay').off();
	},

	close: function() {
		this.$('.modal').slideUp('fast', function() {
			this.sendAction();
		}.bind(this));
	}
});