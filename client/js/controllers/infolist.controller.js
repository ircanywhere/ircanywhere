App.InfolistController = Ember.ArrayController.extend({
	title: '',
	items: [],

	sortProperties: ['timestamp'],
	sortAscending: false,

	populateData: function(data) {
		if (!data.channel || !data.items || !data.type) {
			this.send('closeModal');
		}

		if (data.type === 'banList') {
			this.set('title', 'Ban List for ' + data.channel);
		} else if (data.type === 'inviteList') {
			this.set('title', 'Invite List for ' + data.channel);
		} else if (data.type === 'exceptList') {
			this.set('title', 'Exception List for ' + data.channel);
		} else if (data.type === 'quietList') {
			this.set('title', 'Quiet List for ' + data.channel);
		}

		this.set('items', data.items);
	},

	content: function() {
		var items = this.get('items');

		items.forEach(function(item) {
			item.date = new Date(parseInt(item.timestamp) * 1000).format('g:i A \\o\\n l jS F Y');
		});

		return items;
	}.property('items').cacheable(),

	actions: {
		close: function() {
			return this.send('closeModal');
		}
	}
});

App.injectController('infolist');