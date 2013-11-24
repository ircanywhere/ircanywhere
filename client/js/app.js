Meteor.call('getConfig', function(err, result) {
	Meteor.config = result;
});