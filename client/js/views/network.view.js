App.NetworkView = Ember.View.extend({
	layoutName: 'main',
	templateName: 'tab',
	classNames: 'main-view',
	controller: App.NetworkController,
	
	isChannel: function() {
		return (this.get('context.selectedTab.type') === 'channel');
	}.property('context.selectedTab.type').cacheable(),

	showUserList: function() {
		return (this.get('context.selectedTab.type') === 'channel' && this.get('context.selectedTab.active'));
	}.property('context.selectedTab.type', 'context.selectedTab.active').cacheable(),

	tabId: function() {
		return 'tab-' + this.get('context.selectedTab._id');
	}.property('context.selectedTab._id').cacheable()
});