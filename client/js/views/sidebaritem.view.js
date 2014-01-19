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
	}.property('context.selected'),
	
	getClass: function() {
		var classNames = [''],
			tab = this.get('context'),
			network = App.__container__.lookup('controller:sidebar').get('networks').findBy('_id', tab.network);
		// ember people will hate me for using this but afaik it's impossible
		// to get the network

		if (tab.get('type') === 'network' && network.get('internal').status === 'connecting') {
			classNames.push('net-loader');
		} else if (tab.get('type') === 'network' && network.get('internal').status !== 'connecting') {
			classNames.push('net-loaded');
		} else if (tab.get('type') === 'channel' || tab.get('type') === 'query') {
			
		} else {
			classNames.push('net-loaded');
		}

		return classNames.join(' ');
	}.property('context').cacheable(),

	url: function() {
		var split = this.get('context').get('url').split('/');

		return (split.length == 1) ? split[0] : split[0] + '/' + encodeURIComponent(split[1]);
	}.property('context.url')
});