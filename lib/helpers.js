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
	}
}