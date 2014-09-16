App.MessagesView = Ember.View.extend(App.Scrolling, {
	templateName: 'messages',
	classNames: 'backlog',
	classNameBindings: ['push'],

	push: function() {
		return (this.get('controller.target.content.selectedTab.showMessageBar')) ? 'push' : '';
	}.property('controller.target.content.selectedTab.showMessageBar').cacheable(),

	animateScrollTo: function (scrollTo) {
		this.$().animate({
			scrollTop: scrollTo
		}, 250);
		// Animate scroll to work around iPhone bug on setting scroll
		// position on touch scrollable elements.
	},

	didInsertElement: function() {
		Ember.run.later(this, function() {
			this.animateScrollTo(this.$().context.scrollHeight);
			this.set('scrollPosition', this.$().context.scrollHeight);
		}, 100);
		// scroll to bottom on render

		this.bindScrolling({debounce: 50, element: this.$()});
		// scroll handler

		this.scrolled();
		// immediately run this when the element is inserted

		Ember.$(document).on('keydown', this.documentKeyDown.bind(this));
		// bind keydown event so we can hook onto ESC
	},

	willRemoveElement: function() {
		Ember.$(document).off('keydown', this.documentKeyDown.bind(this));
		// unbind keydown

		this.unbindScrolling();
	},

	documentKeyDown: function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode === 27) {
			this.get('controller.target').markAllAsRead(this.get('controller.target.content.selectedTab._id'));
		}
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
					this.animateScrollTo(this.$().context.scrollHeight);
					this.set('scrollPosition', this.$().context.scrollHeight);
				}
			}, 100);
		}
		// we need to reposition the scrollbar!

		Ember.run.later(this, function() {
			this.scrolled();
		}, 100);
	}.observes('controller.filtered.@each'),

	scrolled: function() {
		if (this.$() === undefined) {
			return false;
		}
		// we've not rendered the view yet so just bail
		
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
	}.observes('App.isActive')
});