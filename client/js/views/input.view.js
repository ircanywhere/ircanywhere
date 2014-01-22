App.InputView = Ember.View.extend({
	templateName: 'input',
	classNames: 'channel-input',

	didInsertElement: function() {
		this.$('input').focus();
	},

	keyDown: function(e, v) {
		var keyCode = e.keyCode || e.which,
			key = {enter: 13, tab: 9, up: 38, down: 40};

		if (keyCode === key.enter) {
			this.get('controller').send('sendCommand');
		} else if (keyCode === key.tab) {
			// XXX - todo
		} else if (keyCode === key.up) {
			this.get('controller').send('toggleUp');
		} else if (keyCode === key.down) {
			this.get('controller').send('toggleDown');
		}
	}
});