App.TabController = Ember.ObjectController.extend({
	needs: ['index', 'network'],
	
	updateSelected: function() {
		var tab = this.get('model'),
			selected = this.get('socket.tabs').findBy('selected', true);

		if (selected.get('_id') !== tab.get('_id')) {
			this.socket.update('tabs', {url: tab.get('url')}, {selected: true});
			this.set('controllers.index.tabId', tab.get('_id'));
		}
	}.observes('model')
});