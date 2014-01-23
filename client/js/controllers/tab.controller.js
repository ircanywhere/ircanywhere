App.TabController = Ember.ObjectController.extend({
	updateSelected: function() {
		var tab = this.get('model'),
			selected = this.socket.findOne('tabs', {selected: true});

		if (selected.get('_id') !== tab.get('_id')) {
			this.socket.update('tabs', {url: tab.get('url')}, {selected: true});
		}
	}.observes('model')
});