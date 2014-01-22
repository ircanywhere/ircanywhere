App.InputController = Ember.ObjectController.extend({
	needs: ['network'],

	lastCommand: '',

	nick: function() {

	}.property()
});