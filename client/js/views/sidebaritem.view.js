App.SidebarItemView = Ember.View.extend({
	templateName: 'sidebaritem',
	classNames: 'clear',

	getClass: function() {
		var tab = this.get('context'),
			network = App.__container__.lookup('controller:sidebar').networks.findBy('_id', tab.network);
		// ember people will hate me for using this but afaik it's impossible
		// to get the network

		if (tab.type == 'network' && network.internal.status == 'connecting') {
			return 'net-loader';
		} else if (tab.type == 'network' && network.internal.status !== 'connecting') {
			return 'net-loaded';
		} else if (tab.type == 'channel' || tab.type == 'query') {
			return ''
		} else {
			return 'net-loaded';
		}
	}.property('getClass').cacheable()
});