App.InputBlur = Ember.TextField.extend({
	focusIn: function() {
		if (this.get('value') === this.get('default')) {
			this.set('value', '');
		}
	},

	focusOut: function() {
		if (this.get('value') === '') {
			this.set('value', this.get('default'));
		}
	},
});