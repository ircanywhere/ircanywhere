App.MessagesView = Ember.View.extend(App.Scrolling, {
	templateName: 'messages',
	classNames: 'backlog',

	didInsertElement: function() {
		this.$().context.scrollTop = this.$().context.scrollHeight;
		this.set('scrollPosition', this.$().context.scrollHeight);
		// scroll to bottom on render

		this.bindScrolling({debounce: 50, element: this.$()});
		// scroll handler
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
	}.observes('controller.filtered.@each'),

	scrolled: function() {
		var self = this,
			parent = this.$(),
			container = this.$('.inside-backlog'),
			scrollBottom = parent.height() + parent.scrollTop(),
			scrollTop = scrollBottom - parent.height(),
			elements = highlights = topUnread = bottomUnread = unreadElements = 0,
			markAsRead = false;

		container.find('.row[data-type=privmsg]').each(function(n) {
			// fairly messy selector here, not sure how efficient this is?
			// alot of this code is taken from the previous code base, much time was spent
			// perfecting this and it was in it's most reliable state
			var topOffset = $(this)[0].offsetTop,
				elHeight = $(this)[0].clientHeight,
				realOffset = (topOffset + elHeight);

			console.log(topOffset, scrollTop, topOffset, self.get('scrollPosition'),  scrollTop < topOffset, topOffset < self.get('scrollPosition'));
			if (scrollTop === 0 || scrollTop < topOffset && topOffset < self.get('scrollPosition')) {
				/*markAsRead = true;
				$(this).removeAttr('data-read');*/
			}
			// mark messages in the visible viewport as read
		});

		//console.log(markAsRead);

		self.set('scrollPosition', scrollBottom);
	}
});