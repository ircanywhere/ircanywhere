var laikaConfig = {
	"public": {
		"pageTitle": "IRCAnywhere",
		"enableRegistrations": true
	},
	"server": {
		"secure": false,
		"email": {
			"forceValidation": false,
			"siteName": "IRCAnywhere",
			"from": "IRCAnywhere <no-reply@ircanywhere.com>"
		}
	}
};

if (Meteor.settings == undefined || Object.keys(Meteor.settings).length === 0)
	Meteor.settings = laikaConfig;