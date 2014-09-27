App.ModalDialogComponent = Ember.Component.extend({
	className: '',

	didInsertElement: function() {
		var self = this;

		this.get('element').querySelector('.overlay, .close-icon').addEvent('click', function(e) {
			if ((e.target.className === 'overlay' || e.target.className === 'fa fa-times close-icon') && !self.alert) {
				self.close();
			}
		});
		
		this.$('.modal').slideDown('fast');
		this.get('element').querySelector('a[rel="twipsy"]').addEvent('click', this.nullifyLink.bind(this));

		document.addEvent('keydown', this.documentKeyDown.bind(this));
		// bind keydown event so we can hook onto ESC
	},

	willDestroyElement: function() {
		document.removeEvent('keydown', this.documentKeyDown.bind(this));
		// unbind keydown

		this.$('.overlay').off();
		this.get('element').querySelector('a[rel="twipsy"]').removeEvent('click', this.nullifyLink.bind(this));
	},

	documentKeyDown: function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode === 27 && !this.alert) {
			this.close();
		}
	},

	nullifyLink: function(e) {
		e.preventDefault();
	},

	close: function() {
		var self = this;

		self.$('.modal').slideUp('fast', function() {
			self.sendAction();
		});	
	}
});