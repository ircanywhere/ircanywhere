App.InputView = Ember.View.extend({
	templateName: 'input',
	classNames: 'channel-input',

	events: {
		keyUp: function() {
			alert('up');
		}
	}
});