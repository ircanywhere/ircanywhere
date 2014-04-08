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

	isChannel: function(client, channel) {
		var types = this.exists(client, 'internal.capabilities.channel.types'),
			firstChar = channel.charAt(0);
			types = types || '#';

		return (types.indexOf(firstChar) > -1);
	},

	encodeChannel: function(channel) {
		return channel.replace(/\#/g, '%23');
	},

	decodeChannel: function(channel) {
		return channel.replace(/%23/g, '#');
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
	}
};

try {
	exports.Helpers = Helpers;
} catch (e) {
	
}