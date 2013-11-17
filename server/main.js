config = JSON.parse(Assets.getText('config.json'));

Meteor.startup(function () {
	// code to run on server at startup
	console.log(config.db2);
});