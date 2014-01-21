App.TabView = Ember.View.extend({
	layoutName: 'main',
	templateName: 'tab',
	classNames: 'main-view',

	tabId: function() {
		return 'tab-' + this.get('context').get('_id');
	}.property('context._id')
});