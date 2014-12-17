Helpers = {
	exists: function(obj, prop) {
		var split = prop.split('.');
					
		if (typeof obj === 'object' && obj.hasOwnProperty(split[0])) {
			if (split.length === 1) {
				return obj[split[0]];
			} else {
				return this.exists(obj[split[0]], split.slice(1).join('.'));
			}
		} else {
			return false;
		}
	},

	trimInput: function(val) {
		return val.replace(/^\s*|\s*$/g, '');
	},

	isValidName: function(val) {
		return (val.length >= 35) ? false : true;
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

	isValidTimezoneOffset: function test(val) {
		return val <= 12 * 60 && val >= -12 * 60;
	},

	isChannel: function(client, channel) {
		var types = this.exists(client, 'internal.capabilities.channel.types'),
			firstChar = channel.charAt(0);

		types = types || '#';

		return (types.indexOf(firstChar) > -1);
	},

	isChannelString: function(channel) {
		var validFirstChars = ['#', '!', '&', '+'],
			firstChar = channel.charAt(0);

		return (channel.length <= 50 && validFirstChars.indexOf(firstChar) !== -1);
	},

	encodeChannel: function(channel) {
		return encodeURIComponent(channel);
	},

	decodeChannel: function(channel) {
		return decodeURIComponent(channel);
	},

	escape: function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	},

	cleanObjectIds: function(object) {
		for (var key in object) {
			if (object[key] === null) {
				continue;
			}

			if (typeof object[key] === 'object' && '_bsontype' in object[key]) {
				object[key] = object[key].toString();
			}

			if (typeof object[key] === 'object') {
				this.cleanObjectIds(object[key]);
			}
		}

		return object;
	},

	generateSalt: function(string_length) {
		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
			randomstring = '';
		
		for (var i = 0; i < string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum, rnum + 1);
		}

		return randomstring;
	},

	compareStrings: function(string1, string2, ignoreCase, useLocale) {
		if (ignoreCase) {
			if (useLocale) {
				string1 = string1.toLocaleLowerCase();
				string2 = string2.toLocaleLowerCase();
			}
			else {
				string1 = string1.toLowerCase();
				string2 = string2.toLowerCase();
			}
		}

		return string1 === string2;
	},

	copyArguments: function () {
		var args = new Array(arguments[0].length);
		for (var i = 0; i < args.length; ++i) {
			args[i] = arguments[0][i];
		}

		return args;
	}
};

try {
	exports.Helpers = Helpers;
} catch (e) {
	
}