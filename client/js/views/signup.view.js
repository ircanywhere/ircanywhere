App.SignupView = Ember.View.extend({
	layoutName: 'splash',
	templateName: 'signup',
	classNames: 'clear',

	didInsertElement: function() {
		this.get('element').querySelector('a[rel=twipsy]').addEvent('click', this.nullifyLink.bind(this));
	},

	willDestroyElement: function() {
		this.get('element').querySelector('a[rel=twipsy]').removeEvent('click', this.nullifyLink.bind(this));
	},

	nullifyLink: function(e) {
		e.preventDefault();
	}
});