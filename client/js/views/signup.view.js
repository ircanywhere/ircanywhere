App.SignupView = Ember.View.extend({
	layoutName: 'splash',
	templateName: 'signup',
	classNames: 'clear',

	didInsertElement: function() {
		this.$('a[rel=twipsy]').on('click', this.nullifyLink.bind(this));
	},

	willDestroyElement: function() {
		this.$('a[rel=twipsy]').on('click', this.nullifyLink.bind(this));
	},

	nullifyLink: function(e) {
		e.preventDefault();
	}
});