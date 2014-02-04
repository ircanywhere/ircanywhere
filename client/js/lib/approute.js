AppRoute = Ember.Route.extend({
	renderTemplate: function(controller, model) {
		this.render();

		var pageTitle = this.title ? this.title(controller, model) : null;
		document.title = pageTitle ? pageTitle : App.get('defaultTitle');
	}
});