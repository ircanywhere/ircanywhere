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

	onTabChange: function () {
		var pos = this.get('controller.target.content.selectedTab.userListScrollPosition');
		Ember.run.later(this, function() {
			if (pos) {
				this.animateScrollTo(pos);
			} else {
				this.animateScrollTo(0);
			}
		}, 250);
		// scroll to bottom or last position on render
	}.observes('controller.target.content.selectedTab._id'),

	divClass: function() {
		var classNames = ['userlist'],
			hidden = (this.get('controller.parentController.content.selectedTab.hiddenUsers') === true) ? 'hide' : 'show';
			classNames.push(hidden);

		return classNames.join(' ');
	}.property('controller.parentController.content.selectedTab.hiddenUsers').cacheable(),

	scrolled: function () {
		this.set('controller.target.content.selectedTab.userListScrollPosition', this.$()[0].scrollTop);
	}
});
