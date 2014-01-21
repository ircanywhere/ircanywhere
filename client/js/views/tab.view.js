App.TabView = Ember.View.extend({
	layoutName: 'main',
	templateName: 'tab',
	classNames: 'main-view',

	tabId: function() {
		return 'tab-' + this.get('context._id');
	}.property('context._id')
});