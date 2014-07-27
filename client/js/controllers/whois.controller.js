App.WhoisController = Ember.ArrayController.extend({
	needs: ['network'],

	title: '',
	id: '',
	items: [],

	sortProperties: ['timestamp'],
	sortAscending: false,

	populateData: function(data) {
		if (!data.nickname || !data.username || !data.hostname) {
			this.send('closeModel');
		}

		var items = [];
		for (var key in data) {
			var value = data[key],
				ckey = key.charAt(0).toUpperCase() + key.slice(1);
			
			switch (key) {
				case 'network':
				case 'raw':
				case 'time':
				case 'serverinfo':
				case 'username':
				case 'hostname':
				case 'realname':
					continue;
				case 'nickname':
					var hostmask = data.username + '@' + data.hostname + ' (' + data.realname + ')';
					items.push({key: data.nickname, value: hostmask});
					break;
				case 'idle':
					var totalSec = parseInt(value),
						hours = parseInt(totalSec / 3600) % 24,
						minutes = parseInt(totalSec / 60) % 60,
						seconds = totalSec % 60,
						result = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
					
					items.push({key: 'Idle for', value: result});
					break;
				case 'loggedin':
					items.push({key: 'Logged in as', value: value});
					break;
				case 'server':
					var sinfo = (data.serverinfo) ? ' ' + data.serverinfo : '';
					items.push({key: 'Server', value: value + sinfo});
					break;
				case 'channels':
					items.push({key: 'Channels', value: value.join(' ')});
					break;
				case 'secure':
					items.push({key: 'Secure', value: value});
					break;
				default:
					items.push({key: ckey, value: value});
					break;
			}
		}

		this.set('title', 'Whois information for ' + data.nickname);
		this.set('id', data.network);
		this.set('items', items);
	},

	content: function() {
		return this.get('items');
	}.property('items').cacheable(),

	actions: {
		close: function() {
			return this.send('closeModal');
		}
	}
});