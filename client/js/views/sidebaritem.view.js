App.SidebaritemView = Ember.View.extend({
	tagName: 'li',
	templateName: 'sidebaritem',
	classNameBindings: ['liClass'],

	liClass: function() {
		var classes = ['clear'],
			tab = this.get('controller.content');

		if (tab.get('selected')) {
			classes.push('selected');
		}

		if (tab.get('type') !== 'network') {
			classes.push('child');
		}

		if (tab.get('unread') > 0) {
			classes.push('unread');
		}

		return classes.join(' ');
	}.property('controller.content.selected', 'controller.content.unread').cacheable(),
	
	getClass: function() {
		var classNames = [''],
			tab = this.get('controller.content'),
			network = this.get('controller.parentController.socket.networks').findBy('_id', tab.network);

		if (tab.get('type') === 'network' && network.get('internal').status === 'connecting') {
			classNames.push('net-loader');
		} else if (tab.get('type') === 'network' && network.get('internal').status !== 'connecting') {
			classNames.push('net-loaded');
		} else if (tab.get('type') === 'channel' || tab.get('type') === 'query') {
			
		} else {
			classNames.push('net-loaded');
		}

		return classNames.join(' ');
	}.property('controller.content').cacheable(),

	isPrivmsg: function() {
		return (this.get('controller.content.type') === 'query');
	}.property('controller.content.type').cacheable(),

	url: function() {
		var split = this.get('controller.content.url').split('/');

		return (split.length === 1) ? '#/t/' + split[0] : '#/t/' + split[0] + '/' + Helpers.encodeChannel(split[1]);
	}.property('controller.content.url').cacheable(),

	title: function() {
		var active = this.get('controller.active'),
			title = this.get('controller.title');

		return (!active) ? '(' + title + ')' : title;
	}.property('controller.content.title', 'controller.content.active').cacheable()
});