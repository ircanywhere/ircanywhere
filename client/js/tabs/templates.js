tabEngine = Object.create(TabEngine);

Template.tabs.tabs = function() {
	return tabEngine.renderTabs();
};