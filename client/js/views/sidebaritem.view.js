App.SidebaritemView = Ember.View.extend({
	tagName: 'li',
	templateName: 'sidebaritem',
	classNameBindings: ['liClass'],
	controller: App.SidebaritemController,

	liClass: function() {
		var classes = ['clear'],
			tab = this.get('controller.content');

		if (tab.selected) {
			classes.push('selected');
		}

		if (tab.type !== 'network') {
			classes.push('child');
		}

		return classes.join(' ');
	}.property('controller.content.selected').cacheable(),
	
	getClass: function() {
		var classNames = [''],
			tab = this.get('controller.content'),
			network = this.get('controller.parentController.networks').findBy('_id', tab.network);

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

	url: function() {
		var split = this.get('controller.content.url').split('/');

		return (split.length == 1) ? '#/t/' + split[0] : '#/t/' + split[0] + '/' + encodeURIComponent(split[1]);
	}.property('controller.content.url').cacheable(),

	title: function() {
		var active = this.get('controller.active'),
			title = this.get('controller.title');

		return (!active) ? '(' + title + ')' : title;
	}.property('controller.content.title', 'controller.content.active').cacheable(),
});