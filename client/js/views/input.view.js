App.InputView = Ember.View.extend({
	templateName: 'input',
	tagName: 'div',
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
		var textarea = this.$('textarea');

		if (!e.metaKey && !e.ctrlKey && textarea && !Ember.$('input, textarea').is(':focus')) {
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
		
		Ember.run.later(this, this.resize, 0);
		// Resize after changing textarea content
	},

	resize: function() {
		var textarea = this.$('textarea'),
			element = Ember.$(this.get('element')),
			padding = parseInt(textarea.css('paddingTop'), 10) + parseInt(textarea.css('paddingBottom'), 10);

		textarea.height('auto');
		textarea.height(textarea.prop('scrollHeight') - padding);
		element.height(textarea.prop('scrollHeight') + (padding * 2));
	}
});