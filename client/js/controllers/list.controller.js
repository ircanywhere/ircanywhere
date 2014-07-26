App.ListController = Ember.ArrayController.extend({
	title: '',
	items: [],
	page: 0,
	limit: 20,
	search: '',
	loading: true,

	sortProperties: ['users'],
	sortAscending: false,

	prePopulateData: function(data) {
		if (!data.search || !data.page || !data.network) {
			this.send('closeModal');
		}

		this.set('title', 'Listing channels matching ' + data.search + ' on ' + data.network);
		this.set('search', data.search);
		this.set('page', parseInt(data.page));
		this.set('loading', true);
	},

	populateData: function(data) {
		if (!data.channels || !data.search || !data.limit || !data.page || !data.network) {
			this.send('closeModal');
		}

		this.set('title', 'Listing channels matching ' + data.search + ' on ' + data.network);
		this.set('search', data.search);
		this.set('page', parseInt(data.page));
		this.set('items', data.channels);
		this.set('loading', false);
	},

	isPrev: function() {
		return (!this.get('loading') && this.get('page') > 1);
	}.property('page', 'loading'),

	isNext: function() {
		return (!this.get('loading') && this.get('items').length !== 0 && this.get('items').length === this.get('limit'));
	}.property('items', 'limit', 'loading'),

	content: function() {
		var tab = this.get('socket.tabs').findBy('selected', true);

		if (!tab) {
			return [];
		}
		
		var network = this.get('socket.networks').findBy('_id', tab.get('network')),
			items = this.get('items');

		items.forEach(function(item) {
			item.route = '#/t/' + network.url + '/' + Helpers.encodeChannel(item.channel);
			item.users = parseInt(item.users);
		});

		return items;
	}.property('items').cacheable(),

	actions: {
		prevPage: function() {
			var tab = this.get('socket.tabs').findBy('selected', true),
				page = (this.get('page') - 1);

			if (!tab || page <= 0) {
				return;
			}

			this.socket.send('execCommand', {
				command: '/list ' + this.get('search') + ' ' + page,
				network: tab.network,
				target: tab.target
			});

			this.set('loading', true);
		},

		curPage: function() {
			return false;
		},

		nextPage: function() {
			var tab = this.get('socket.tabs').findBy('selected', true);

			if (!tab) {
				return;
			}

			this.socket.send('execCommand', {
				command: '/list ' + this.get('search') + ' ' + (this.get('page') + 1),
				network: tab.network,
				target: tab.target
			});

			this.set('loading', true);
		},

		close: function() {
			return this.send('closeModal');
		},

		visitLink: function(url) {
			document.location.href = url;
			return this.send('closeModal');
		}
	}
});

App.injectController('list');