App.TabController = Ember.ArrayController.extend({
	events: [],

	ready: function() {
		//this.set('events', this.socket.findAll('events'));
	}
});

Ember.Handlebars.helper('json', function(value, options) {
	return JSON.stringify(value);
});