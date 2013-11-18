Meteor.methods({
	registerUser: function(name, nickname, email, password, confirmPassword) {

		var output = {failed: false, errors: []};

		name = Helpers.trimInput(name);
		nickname = Helpers.trimInput(nickname);
		email = Helpers.trimInput(email);
		// trim inputs

		if (name == '' || nickname == '' || email == '' || password == '' || confirmPassword == '')
			output.errors.push({error: 'All fields are required'});
		// check if the fields have been entered (all are required)

		if (!Helpers.isValidName(name))
			output.errors.push({error: 'The name you have entered is too long'});
		if (!Helpers.isValidNickname(nickname))
			output.errors.push({error: 'The nickname you have entered is invalid'});
		if (!Helpers.isValidEmail(email))
			output.errors.push({error: 'The email address you have entered is invalid'});
		if (!Helpers.isValidPassword(password))
			output.errors.push({error: 'The password you have entered is invalid'});
		if (password != confirmPassword)
			output.errors.push({error: 'The passwords you have entered do not match'});
		// some more validation

		if (output.errors.length > 0) {
			output.failed = true;
			return output;
		}
		// seems we have some errors, lets just return them

		try {
			Accounts.createUser({email: email, password: password, profile: {name: name, nickname: nickname}});
			// try and create the user
		} catch (e) {
			output.failed = true;
			output.errors.push({error: 'The email you have used is already in use'});
			// oh we've caught an error (probably email in use)
		}

		return output;
	}
});