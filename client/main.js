Template.login.create = function () {
	Session.set('forgotPasswordHidden', true);
};

Template.login.visibility = function () {
	return (Session.get('forgotPasswordHidden')) ? 'hide' : 'show';
};

Template.login.events({
	'click a#forgot-password-link' : function (event, template) {
		var currentStatus = Session.get('forgotPasswordHidden');
		Session.set('forgotPasswordHidden', !currentStatus);
		// basically just grab the current status and reverse it to create a toggle effect.

		return false;
	}
});