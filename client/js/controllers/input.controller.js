App.InputController = Ember.ObjectController.extend({
	needs: ['network'],

	commands: [],
	lastCommand: '',

	ready: function() {
		this.set('commands', this.socket.findAll('commands'));
	},

	nick: function() {
		return this.get('controllers.network.model.nick');
	}.observes('controllers.network.model.nick').property('controllers.network.model.nick')
});