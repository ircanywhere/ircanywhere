App.ModalDialogComponent = Ember.Component.extend({
	className: '',

	didInsertElement: function() {
		var overlay = this.$('.overlay'),
			self = this;

		this.$('.overlay').on('click', function(e) {
			if (e.target.className === 'overlay' && !self.alert) {
				self.close();
			}
		});
		
		this.$('.modal').slideDown('fast');
		this.$('a[rel=twipsy]').on('click', this.nullifyLink.bind(this));
	},

	willDestroyElement: function() {
		this.$('.overlay').off();
		this.$('a[rel=twipsy]').on('click', this.nullifyLink.bind(this));
	},

	nullifyLink: function(e) {
		e.preventDefault();
	},

	close: function() {
		this.$('.modal').slideUp('fast', function() {
			this.sendAction();
		}.bind(this));
	}
});