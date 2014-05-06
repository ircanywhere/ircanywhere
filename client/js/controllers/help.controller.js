App.HelpController = Ember.ObjectController.extend({
	title: 'Help',
	helpItems: [],

	init: function() {
		this.set('helpItems', [
			{
				'command': '/nick <strong>nickname</strong>',
				'desc': 'Change your nickname'
			},
			{
				'command': '/connect',
				'desc': 'Connect to the current server'
			},
			{
				'command': '/reconnect',
				'desc': '&rarr; <strong>/connect</strong>'
			},
			{
				'command': '/disconnect <strong>message</strong>',
				'desc': 'Disconnect from the current server'
			},
			{
				'command': '/list <strong>pattern</strong> [page]',
				'desc': 'Searches the channel list with the pattern eg *php* or * for all',
			},
			{
				'command': '/whois <strong>nickname</strong>',
				'desc': 'Performs a whois command on the specified nickname',
			},
			{
				'command': '/quit <strong>message</strong>',
				'desc': '&rarr; <strong>/disconnect</strong>'
			},
			{
				'command': '/query <strong>target</strong>',
				'desc': 'Open a query window to the target'
			},
			{
				'command': '/q',
				'desc': '&rarr; <strong>/query</strong>'
			},
			{
				'command': '/close',
				'desc': 'Close the current tab or network window'
			},
			{
				'command': '/away <strong>message</strong>',
				'desc': 'Mark yourself as away with the specified message',
			},
			{
				'command': '/unaway',
				'desc': 'Mark yourself as back',
			},
			{
				'command': '/raw <strong>command</strong>',
				'desc': 'Send a raw command to the server',
			},
			{
				'command': '/join <strong>channel</strong> [key]',
				'desc': 'Join the specified channel with an optional key',
			},
			{
				'command': '/j',
				'desc': '&rarr; <strong>/join</strong>',
			},
			{
				'command': '/part <strong>channel</strong>',
				'desc': 'Leave the specified channel',
			},
			{
				'command': '/leave',
				'desc': '&rarr; <strong>/part</strong>',
			},
			{
				'command': '/p',
				'desc': '&rarr; <strong>/part</strong>',
			},
			{
				'command': '/cycle',
				'desc': 'Leave and then immediately join a channel',
			},
			{
				'command': '/hop',
				'desc': '&rarr; <strong>/cycle</strong>',
			},
			{
				'command': '/topic [channel] <strong>topic</strong>',
				'desc': 'Change the topic for a channel',
			},
			{
				'command': '/mode [channel] <strong>mode</strong>',
				'desc': 'Set a mode in a channel',
			},
			{
				'command': '/invite [channel] <strong>nick</strong>',
				'desc': 'Invite a user to a channel',
			},
			{
				'command': '/kick [channel] <strong>nick</strong> [message]',
				'desc': 'Kick a user from a channel',
			},
			{
				'command': '/kickban [channel] <strong>nick</strong> [message]',
				'desc': 'Kick and ban a user from a channel',
			},
			{
				'command': '/ban <strong>target</strong>',
				'desc': 'Ban a user or hostmask',
			},
			{
				'command': '/unban <strong>target</strong>',
				'desc': 'Unban a user or hostmask',
			},
			{
				'command': '/ctcp <strong>target</strong> <strong>message</strong>',
				'desc': 'Send a ctcp request out',
			},
			{
				'command': '/msg [target] <strong>message</strong>',
				'desc': 'Sends a privmsg to a target or current tab',
			},
			{
				'command': '/notice [target] <strong>message</strong>',
				'desc': 'Sends a notice to a target or current tab',
			},
			{
				'command': '/me [target] <strong>message</strong>',
				'desc': 'Sends an action to a target or current tab',
			}
		]);
	},

	actions: {
		close: function() {
			return this.send('closeModal');
		}
	}
});