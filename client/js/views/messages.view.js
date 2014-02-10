App.MessagesView = Ember.View.extend(App.Scrolling, {
	templateName: 'messages',
	classNames: 'backlog',

	didInsertElement: function() {
		this.$().context.scrollTop = this.$().context.scrollHeight;
		this.set('scrollPosition', this.$().context.scrollHeight);
		// scroll to bottom on render

		this.bindScrolling({debounce: 50, element: this.$()});
		// scroll handler

		if (this.$()[0].scrollHeight <= this.$()[0].clientHeight) {
			this.scrolled();
		}
		// immediately run this when the element is inserted
	},

	willRemoveElement: function() {
		this.unbindScrolling();
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
					this.set('scrollPosition', this.$().context.scrollHeight);
				}
			}, 100);
		}
		// we need to reposition the scrollbar!

		if (this.$()[0].scrollHeight <= this.$()[0].clientHeight) {
			this.scrolled();
		}
		// seems the viewport doesn't have a scrollbar yet, we'll handle this.scrolled to check for unreads though
	}.observes('controller.filtered.@each'),

	scrolled: function() {
		var self = this,
			parent = this.$(),
			container = this.$('.inside-backlog'),
			tabId = parent.parents('.tab').attr('id').substr(4),
			scrollBottom = parent.height() + parent.scrollTop(),
			scrollTop = scrollBottom - parent.height();
		
		this.controller.send('detectUnread', tabId, scrollTop, scrollBottom, container);
		// send to controller to do the actual updating

		self.set('scrollPosition', scrollBottom);
		// reset the scroll position
	}.observes('App.isActive'),
});