/*
 * $.reset()
 *
 * Resets a form
 */
$.fn.reset = function ()
{
	$(this).each(function()
	{
		if ($(this).attr('type') != 'submit' || $(this).attr('type') != 'button')
			this.reset();
	});
};

$(window).load(function()
{
	$('body').tooltip({
		selector: 'a[rel=twipsy]',
		placement: 'right',
		trigger: 'hover'
	});
	// rel links, which means they should always be prevented, but do something other than tabbing

	$('input#login-username').on('focus', function(e)
	{
		if ($(e.currentTarget).val() == 'Username or Email Address')
			$(e.currentTarget).val('');
	});

	$('input#login-username').on('blur', function(e)
	{
		if ($(e.currentTarget).val() == '')
			$(e.currentTarget).val('Username or Email Address');
	});

	$('input#login-pass').on('focus', function(e)
	{
		if ($(e.currentTarget).val() == 'Password')
			$(e.currentTarget).val('');
	});

	$('input#login-pass').on('blur', function(e)
	{
		if ($(e.currentTarget).val() == '')
			$(e.currentTarget).val('Password');
	});

	$('input#reset-email').on('focus', function(e)
	{
		if ($(e.currentTarget).val() == 'Email Address')
			$(e.currentTarget).val('');
	});

	$('input#reset-email').on('blur', function(e)
	{
		if ($(e.currentTarget).val() == '')
			$(e.currentTarget).val('Email Address');
	});

	$('a#forgot-password-link').on('click', function(e)
	{
		var shown = $('div#forgot-password').is(':visible');
		$('div#forgot-password, div#forgot-password-actions').toggle();

		if (!shown)
			$('div#login-box div.actions:first').addClass('actions-no-rounded').removeClass('actions');
		else
			$('div#login-box div.actions:first').addClass('actions').removeClass('actions-no-rounded');
		// fade the form in, and remove the rounded corners from the above class

		e.preventDefault();
	});

	$('form#login-form').on('submit', function(e)
	{
		$.post('/login', $('form#login-form').serialize(), function(data)
		{
			if (data.logged_in)
			{
				location.reload(true);
			}
			else
			{
				$('div#login-error').empty().html('<div class="alert-message block-message error hide">' + data.error + '</div>');
				$('div#login-error .error').fadeIn();
			}
		}, 'json');

		e.preventDefault();
	});

	$('form#reset-form').on('submit', function (e)
	{
		$.post('/reset/false', $('form#reset-form').serialize(), function(data)
		{
			var response = (data.error) ? '<div class="alert-message block-message error hide">' + data.error_message[0] + '</div>' : '<div class="alert-message block-message success hide">' + data.success_message + '</div>';
			$('div#reset-response').empty().html(response);
			$('div#reset-response .error, div#reset-response .success').fadeIn();
			$('form#reset-form input#reset-email').val('Email Address');

		}, 'json');

		e.preventDefault();
	});

	$('form#signup-form').on('submit', function(e)
	{
		$('div#message-holder').html('<div class="sub-loading"><img src="/static/images/loader.gif" alt="Loading" /></div>');
		$.post(window.location.href, $('form#signup-form').serialize(), function(data)
		{
			if (data.error)
			{
				$('form#signup-form div#message-holder').empty().html('<div class="alert-message block-message error"><ul></ul></div>');
				for (var msg in data.error_message)
					$('form#signup-form div#message-holder div ul').append('<li>' + data.error_message[msg] + '</li>');
			}
			// if data.error = true then show the error etc.
			else
			{
				$('form#signup-form div#message-holder').empty().html('<div class="alert-message block-message success"><p>' + data.success_message + '</p></div>');
				$('form#signup-form').reset();
			}
		}, 'json');

		e.preventDefault();
	});

	$('form#contact-form').on('submit', function(e)
	{
		$('div#message-holder').empty().html('<div class="sub-loading"><img src="/static/images/loader.gif" alt="Loading" /></div>');
		$.post('/contact', $('form#contact-form').serialize(), function(data)
		{
			if (data.error)
			{
				$('form#contact-form div#message-holder').empty().html('<div class="alert-message block-message error"><ul></ul></div>');
				for (var msg in data.error_message)
					$('form#contact-form div#message-holder div ul').append('<li>' + data.error_message[msg] + '</li>');
			}
			// if data.error = true then show the error etc.
			else
			{
				$('form#contact-form div#message-holder').empty().html('<div class="alert-message block-message success"><p>' + data.success_message + '</p></div>');
				$('form#contact-form').reset();
			}
		}, 'json');

		e.preventDefault();
	});

	$('form#reset-password-form').on('submit', function(e)
	{
		$.post('/reset/true', $('form#reset-password-form').serialize(), function(data)
		{
			if (data.error)
			{
				$('form#reset-password-form div#message-holder').html('<br /><div class="alert-message block-message error"><ul></ul></div>');
				for (var msg in data.error_message)
					$('form#reset-password-form div#message-holder div ul').append('<li>' + data.error_message[msg] + '</li>');
			}
			else
			{
				$('form#reset-password-form p, form#reset-password-form div.clearfix, form#reset-password-form input[type=submit]').empty().remove();
				$('form#reset-password-form div#message-holder').empty().html('<br /><div class="alert-message block-message success"><p>' + data.success_message + '</p></div>');
			}
		}, 'json');

		e.preventDefault();
	});
});