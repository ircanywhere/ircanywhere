Template.main.data = function() {
	return JSON.stringify(Channels.find().fetch(), undefined, 2);
};