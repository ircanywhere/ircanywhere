App.UserlistView = Ember.View.extend(App.Scrolling, {
	templateName: 'userlist',
	classNameBindings: ['divClass'],
	controller: App.UserlistController,

	didInsertElement: function() {
		this.bindScrolling({debounce: 50, element: this.$()});
		// scroll handler

		this.scrolled();
		// immediately run this when the element is inserted
	},

	willRemoveElement: function() {
		this.unbindScrolling();
	},

	animateScrollTo: function (scrollTo) {
		if (!this.$()) {
			return false;
		}

		this.$().animate({
			scrollTop: scrollTo
		}, 0);
		// Animate scroll to work around iPhone bug on setting scroll
		// position on touch scrollable elements.
	},

	onTabChange: function() {
		Ember.run.scheduleOnce('afterRender', this, this.onRender);

		this.set('controller.rerender', true);
		this.rerender();
	}.observes('controller.target.content.selectedTab._id'),

	divClass: function() {
		var classNames = ['userlist'],
			hidden = (this.get('controller.target.content.selectedTab.hiddenUsers') === true) ? 'hide' : 'show';
			classNames.push(hidden);

		return classNames.join(' ');
	}.property('controller.target.content.selectedTab.hiddenUsers').cacheable(),

	scrolled: function() {
		if (this.get('controller.target.content.selectedTab')) {
			this.set('controller.target.content.selectedTab.userListScrollPosition', this.$()[0].scrollTop);
		}
	},

	onRender: function() {
		var pos = this.get('controller.target.content.selectedTab.userListScrollPosition');
		if (pos) {
			this.animateScrollTo(pos);
		} else {
			this.animateScrollTo(0);
		}
		// scroll to bottom or last position on render

		this.set('controller.rerender', false);
	}
});
