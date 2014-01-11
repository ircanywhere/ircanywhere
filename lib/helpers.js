Meteor.Helpers = {
	trimInput: function(val) {
		return val.replace(/^\s*|\s*$/g, '');
	},

	isValidName: function(val) {
		return val.length >= 35 ? false : true;
	},

	isValidNickname: function(val) {
		return val.match(/^[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*$/gi);
	},

	isValidEmail: function(val) {
		return val.match(/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/gi);
	},

	isValidPassword: function(val) {
		return val.length >= 6 ? true : false; 
	},

	isChannel: function(types, channel) {
		var firstChar = channel.charAt(0);

		if (types !== undefined && types.indexOf(firstChar) > -1) {
			return true;
		}
		// if the channel is a valid type then return true

		return false;
	},

	encodeChannel: function(channel) {
		return channel
				.replace('#', '%23')
				.replace('&', '%26')
				.replace('+', '%2B')
				.replace('!', '%21');
	},

	decodeChannel: function(channel) {
		return channel
				.replace('%23', '#')
				.replace('%26', '&')
				.replace('%2B', '+')
				.replace('%21', '!');
	},

	escape: function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	}
}