App.MessagesView = Ember.View.extend(App.Scrolling, {
	templateName: 'messages',
	classNames: 'backlog',
	classNameBindings: ['push'],

	push: function() {
		return (this.get('controller.target.content.selectedTab.unread')) ? 'push' : '';
	}.property('controller.target.content.selectedTab.unread').cacheable(),

	animateScrollTo: function (scrollTo) {
		if (!this.$()) {
			return false;
		}

		this.$().animate({
			scrollTop: scrollTo
		}, 50);
		// Animate scroll to work around iPhone bug on setting scroll
		// position on touch scrollable elements.

		this.scrolled();
	},

	didInsertElement: function() {
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
			e.preventDefault();
		}
	},

	onTabChange: function () {
		var pos = this.get('controller.target.content.selectedTab.scrollPosition');
		Ember.run.later(this, function() {
			if (pos) {
				this.animateScrollTo(pos);
			} else {
				this.animateScrollTo(this.$().context.scrollHeight);
			}
		}, 250);
		// scroll to bottom or last position on render
	}.observes('controllers.index.tabId'),

	resizeSensor: function() {
		if (!this.$()) {
			return false;
		}
		// we've not rendered the view yet so just bail

		var self = this,
			parent = this.$().context,
			height = parent.scrollHeight - parent.clientHeight,
			pos = parent.scrollTop,
			last = this.$('.inside-backlog').find('div.row:last-of-type'),
			offset = height - pos,
			scrollHeight = this.$().context.scrollHeight;
		// get some variables and do some calculations
		
		if ((offset === last.height() || pos === height) && this.get('controller.controllers.index.isActive')) {
			Ember.run.later(self, function() {
				this.animateScrollTo(scrollHeight);
			}, 100);
		}
		// we need to reposition the scrollbar!
	}.observes('controller.filtered.@each'),

	scrolled: function() {
		if (!this.$() || !this.get('controller.controllers.index.isActive')) {
			return false;
		}
		// ignore tabs in this state
		
		var parent = this.$(),
			tabId = parent.parents('.tab').attr('id').substr(4),
			scrollBottom = parent.height() + parent.scrollTop(),
			scrollTop = scrollBottom - parent.height();

		this.controller.send('detectUnread', tabId, scrollTop, scrollBottom);
		// send to controller to do the actual updating

		this.set('controller.target.content.selectedTab.scrollPosition', this.$()[0].scrollTop);
		this.set('scrollPosition', scrollBottom);
		// reset the scroll position
	}.observes('controller.controllers.index.isActive')
});