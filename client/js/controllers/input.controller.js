App.InputController = Ember.ObjectController.extend({
	needs: ['network'],

	lastCommand: '',

	nick: function() {
		return this.get('controllers.network.model.nick');
	}.observes('controllers.network.model.nick').property('controllers.network.model.nick')
});