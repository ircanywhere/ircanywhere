App.IndexRoute = AppRoute.extend({
	activate: function() {
		this.controllerFor('index').determinePath();
		this.updateTitle();
	}
});