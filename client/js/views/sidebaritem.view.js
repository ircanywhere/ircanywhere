App.SidebarItemView = Ember.View.extend({
	tagName: 'li',
	templateName: 'sidebaritem',
	classNameBindings: ['liClass'],

	liClass: function() {
		var classes = ['clear'],
			tab = this.get('context');

		if (tab.selected) {
			classes.push('selected');
		}

		if (tab.type !== 'network') {
			classes.push('child');
		}

		return classes.join(' ');
	}.property(),
	
	getClass: function() {
		var classNames = [''],
			tab = this.get('context'),
			network = App.__container__.lookup('controller:sidebar').networks.findBy('_id', tab.network);
		// ember people will hate me for using this but afaik it's impossible
		// to get the network

		if (tab.type === 'network' && network.internal.status === 'connecting') {
			classNames.push('net-loader');
		} else if (tab.type === 'network' && network.internal.status !== 'connecting') {
			classNames.push('net-loaded');
		} else if (tab.type === 'channel' || tab.type === 'query') {
			
		} else {
			classNames.push('net-loaded');
		}

		return classNames.join(' ');
	}.property().cacheable()
});