if (Meteor.user() !== null)
	Session.set('loggedIn', true);
else
	Session.set('loggedIn', false);
// set our logged in section (this doesn't give any extra permissions or bypass anything)
// it's simply there to make our subscriptions reactive, ie automatically retrievable
// on login etc.

Deps.autorun(function(c) {
	if (Session.equals('loggedIn', true))
		Meteor.subscribe('networks');
});