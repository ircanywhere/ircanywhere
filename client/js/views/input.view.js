App.InputView = Ember.View.extend({
	templateName: 'input',
	tagName: 'table',
	classNames: 'channel-input',

	didInsertElement: function() {
		Ember.$(document).on('keydown', this.documentKeyDown.bind(this));
		// bind an event to re-focus the box when someone hits a key
		// it's not entirely ember-ish binding events manually but it's
		// difficult to do this without doing so
		
		this.$('textarea').on('keydown', this.onKeyDown.bind(this));
		this.$('textarea').focus();
	},

	willDestroyElement: function() {
		Ember.$(document).off('keydown', this.documentKeyDown.bind(this));
		this.$('textarea').off('keydown', this.onKeyDown.bind(this));
	},

	documentKeyDown: function(e) {
		if (!Ember.$('input, textarea').is(':focus')) {
			this.$('textarea').focus();
		}
	},

	onKeyDown: function(e) {
		var keyCode = e.keyCode || e.which,
			key = {enter: 13, tab: 9, up: 38, down: 40};

		if (keyCode === key.enter) {
			this.get('controller').send('sendCommand');
			e.preventDefault();

			if (App.get('size') !== 'large') {
				document.activeElement.blur();
			}
		} else if (keyCode === key.tab) {
			this.get('controller').send('tabComplete');
			e.preventDefault();
		} else if (keyCode === key.up) {
			this.get('controller').send('toggleUp');
			this.get('controller').send('resetTabCompletion');
		} else if (keyCode === key.down) {
			this.get('controller').send('toggleDown');
			this.get('controller').send('resetTabCompletion');
		} else {
			this.get('controller').send('resetTabCompletion');
		}
	}
});