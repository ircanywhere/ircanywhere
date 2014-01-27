App.UserlistView = Ember.View.extend({
	templateName: 'userlist',
	classNameBindings: ['divClass'],
	controller: App.UserlistController,

	divClass: function() {
		var classNames = ['userlist'],
			hidden = (this.get('controller.parentController.content.selectedTab.hiddenUsers') === true) ? 'hide' : 'show';
			classNames.push(hidden);

		return classNames.join(' ');
	}.property('controller.parentController.content.selectedTab.hiddenUsers').cacheable()
});