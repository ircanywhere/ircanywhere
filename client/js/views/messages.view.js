App.MessagesView = Ember.View.extend({
	templateName: 'messages',
	classNames: 'backlog',

	didInsertElement: function() {
		this.$().context.scrollTop = this.$().context.scrollHeight;
		// scroll to bottom on render
	},

	resizeSensor: function() {
		if (this.$() === undefined) {
			return false;
		}
		// we've not rendered the view yet so just bail

		var parent = this.$().context,
			height = parent.scrollHeight - parent.clientHeight,
			pos = parent.scrollTop,
			last = this.$('.inside-backlog').find('div.row:last-of-type'),
			offset = height - pos;
		// get some variables and do some calculations

		if (offset === last.height() || pos === height) {
			Ember.run.later(this, function() {
				if (this.$() !== undefined) {
					this.$().context.scrollTop = this.$().context.scrollHeight;
				}
			}, 100);
		}
	}.observes('controller.filtered.@each')
});