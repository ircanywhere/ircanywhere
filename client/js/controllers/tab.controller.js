App.TabController = Ember.ArrayController.extend({
	title: 'dawg',

	filteredContent: Ember.computed.filterBy('content', 'channel', '#ircanywhere-test'),
	// filter it to a specific channel

	ready: function() {
		this.set('content', this.socket.findAll('events'));
		// set the content when we're ready

		var location = document.location,
			url = location.pathname;
			url = (url.substring(url.length - 1, url.length) === '/') ? url.substring(3, url.length - 1) : url.substring(3);

		if (url === '') {
			return false;
		}
		
		this.socket.update('tabs', {url: decodeURIComponent(url)}, {selected: true});
	}
});

Ember.Handlebars.helper('json', function(value, options) {
	return JSON.stringify(value);
});