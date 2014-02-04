AppRoute = Ember.Route.extend({
	updateTab: function(url) {
		var index = this.controllerFor('index'),
			socket = index.socket,
			tab = socket.findOne('tabs', {url: url}),
			selected = socket.findOne('tabs', {selected: true});

		console.log(selected.get('_id'), tab.get('_id'));

		if (selected.get('_id') !== tab.get('_id')) {
			socket.findAll('tabs').setEach('selected', false);
			tab.set('selected', true);
			// update our local storage immediately so we dont get a delay on tab change

			index.socket.update('tabs', {_id: tab.get('_id')}, {selected: true});
			// send the update to the backend
		}
		// get the tab model

		index.set('tabId', tab.get('_id'));
	},

	renderTemplate: function(controller, model) {
		this.render();

		var pageTitle = this.title ? this.title(controller, model) : null;
		document.title = pageTitle ? pageTitle : App.get('defaultTitle');
	}
});