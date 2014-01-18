App.SidebarController = Ember.ArrayController.extend({
	statusChanged: function() {
		Ember.$.each(Ember.View.views, function() {
			if (this.get('templateName') === 'sidebar') {
				this.rerender();
			}
		});
		// XXX - i don't really like this but hey it works, I'll come back to it at some
		// point in the future and see if theres a better way
	}.observes('networks.@each.internal', 'content.@each.selected'),

	ready: function() {
		var self = this,
			networks = this.socket.findAll('networks'),
			content = this.socket.findAll('tabs');

		this.set('networks', networks);
		this.set('content', content);
		// set that to the tabs collection, it'll update automatically when they change
	}
});