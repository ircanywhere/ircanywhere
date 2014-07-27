/*global AppRoute:true */
AppRoute = Ember.Route.extend({
	updateTitle: function(title) {
		if (title) {
			document.title = title;
			App.set('title', title);
		} else {
			document.title = App.defaultTitle;
			App.set('title', App.defaultTitle);
		}
	}
});