App.ApplicationRoute = Ember.Route.extend({
	actions: {
		openModal: function(modalName) {
			return this.render(modalName, {
				into: 'application',
				outlet: 'modal',
				controller: modalName
			});
		},
		
		closeModal: function() {
			return this.disconnectOutlet({
				outlet: 'modal',
				parentView: 'application'
			});
		},

		goto: function(url) {
			url = url.substring(4);
			// cut the #/t/ off the front

			var split = url.split('/');

			if (split.length === 1) {
				this.transitionTo('network', split[0]);
			} else {
				this.transitionTo('tab', split[0], split[1]);
			}
		}
	}
});