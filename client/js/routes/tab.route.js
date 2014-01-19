App.Router.map(function() {
	/*this.resource('tab', function() {*/
		/*this.route('channel', {path: '/t/:url'});*/
		this.route('tab', {path: '/t/:url'});
	/*});*/
});

App.TabRoute = AppRoute.extend({
	model: function() {
		return this.controllerFor('index').socket.connect();
	},

	activate: function() {
		var location = document.location,
			url = location.pathname;
			url = url.substring(3, url.length - 1);

		if (url !== '') {
			console.log(url);
		}
		/*this.get('controller').socket.emit('update', {
			collection: 'tabs',
			query: {url: url},
			update: {selected: true}
		});*/
	},

	actions: {
		error: function(reason) {
			this.transitionToRoute('login');
		},

		loading: function(transition, original) {
			return true;
		}
	},
	
	title: function(controller, model) {
		return controller.get('title');
	}
});