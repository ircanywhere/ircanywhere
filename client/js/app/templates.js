Template.main.data = function() {
	return JSON.stringify(Channels.find().fetch(), undefined, 2);
};

Template.main.events = function() {
	return Events.find().fetch();
}

Template.main.event = function(json) {
	return JSON.stringify(json, undefined, 2);
}