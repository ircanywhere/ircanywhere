CONFIG = {
	"public": {
		"pageTitle": "IRCAnywhere",
		"enableRegistrations": true
	},
	"server": {
		"ssl": false,
		"email": {
			"forceValidation": true,
			"siteName": "IRCAnywhere",
			"from": "IRCAnywhere <no-reply@ircanywhere.com>"
		},
		"clientSettings": {
			"networkLimit": 2,
			"networkRestriction": "*.verxe.net",
			"identPrefix": "ia"
		},
		"defaultNetwork": {
			"host": "irc.verxe.net",
			"port": 6667,
			"realName": "IRC Client",
			"autoRejoin": false,
			"autoConnect": true,
			"retryCount": 10,
			"retryDelay": 1000,
			"secure": false,
			"password": "",
			"channels": [
				"#ircanywhere-test channel-password"
			]
		}
	}
}