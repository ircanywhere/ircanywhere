App.SidebarController = Ember.ArrayController.extend({
	statusChanged: function() {
		Ember.$.each(Ember.View.views, function() {
			if (this.get('templateName') === 'sidebar') {
				this.rerender();
			}
		});
		// XXX - i don't really like this but hey it works, I'll come back to it at some
		// point in the future and see if theres a better way
	}.observes('networks.@each.internal'),
	
	sortProperties: ['url'],
	sortAscending: true,

	ready: function() {
		var self = this,
			networks = this.socket.findAll('networks'),
			content = this.socket.find('tabs', {});

		this.set('networks', networks);
		this.set('content', content);
		// set that to the tabs collection, it'll update automatically when they change
	},

	actions: {
		goto: function(url) {
			url = url.substring(3);
			// cut the /t/ off the front

			var split = url.split('/');

			if (split.length === 1) {
				this.transitionToRoute('network', split[0]);
			} else {
				this.transitionToRoute('tab', split[0], split[1]);
			}
		}
	}
});