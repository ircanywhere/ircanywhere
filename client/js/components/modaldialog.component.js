App.ModalDialogComponent = Ember.Component.extend({
	didInsertElement: function() {
		this.$('.modal').slideDown('fast');
	},

	actions: {
		close: function() {
			Ember.$('.modal').slideUp('fast', function() {
				this.sendAction();
			}.bind(this));
		}
	}
});