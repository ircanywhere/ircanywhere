App.ModalDialogComponent = Ember.Component.extend({
	className: '',

	didInsertElement: function() {
		var self = this;

		this.$('.overlay, .close-icon').on('click', function(e) {
			if ((e.target.className === 'overlay' || e.target.className === 'fa fa-times close-icon') && !self.alert) {
				self.close();
			}
		});
		
		this.$('.modal').slideDown('fast');
		this.$('a[rel=twipsy]').on('click', this.nullifyLink.bind(this));

		Ember.$(document).on('keydown', this.documentKeyDown.bind(this));
		// bind keydown event so we can hook onto ESC
	},

	willDestroyElement: function() {
		Ember.$(document).off('keydown', this.documentKeyDown.bind(this));
		// unbind keydown

		this.$('.overlay').off();
		this.$('a[rel=twipsy]').on('click', this.nullifyLink.bind(this));
	},

	documentKeyDown: function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode === 27 && !this.alert) {
			this.close();
			e.preventDefault();
		}
	},

	nullifyLink: function(e) {
		e.preventDefault();
	},

	close: function() {
		var self = this,
			modal = self.$('.modal');

		if (!self.$ || !modal) {
			return false;
		}

		modal.slideUp('fast', function() {
			self.sendAction();
		});	
	}
});