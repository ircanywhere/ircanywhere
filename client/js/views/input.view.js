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
		this.$('textarea').on('cut paste drop', this.resize.bind(this));
	},

	willDestroyElement: function() {
		Ember.$(document).off('keydown', this.documentKeyDown.bind(this));

		this.$('textarea').off('keydown', this.onKeyDown.bind(this));
		this.$('textarea').off('cut paste drop', this.resize.bind(this));
	},

	documentKeyDown: function(e) {
		var textarea = document.querySelector('.channel-input textarea'),
			element = document.querySelector('.channel-input input, .channel-input textarea');

		if (!e.metaKey && !e.ctrlKey && textarea && element !== document.activeElement) {
			textarea.focus();
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
			this.get('controller').send('resetTabCompletion');
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
		setTimeout(this.resize.bind(this), 0);
		// Resize after changing textarea content
	},

	resize: function() {
		var textarea = document.querySelector('.channel-input textarea'),
			txStyle = window.getComputedStyle(textarea, null),
			element = this.get('element'),
			padding = parseInt(txStyle['padding-top'], 10) + parseInt(txStyle['padding-bottom'], 10);

		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight - padding;

		element.style.height = textarea.scrollHeight + (padding * 2);
	}
});