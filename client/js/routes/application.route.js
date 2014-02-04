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
		}
	}
});