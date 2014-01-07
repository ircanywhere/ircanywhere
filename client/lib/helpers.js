Handlebars.registerHelper('time', function(context, options) {
	var time = new Date(context),
		ap = 'AM',
		now = new Date(time),
		hour = now.getHours(),
		minute = now.getMinutes();
		minute = (minute < 10) ? '0' + minute : minute;

	if (hour > 11) {
		ap = 'PM';
	}

	if (hour > 12) {
		hour = hour - 12;
	}

	if (hour == 0) {
		hour = 12;
	}
	
	return hour + ':' + minute + ' ' + ap;
});

Handlebars.registerHelper('userLink', function(context, tab, show, options) {
	var prefix = context.extra.prefix,
		prefixClass = '',
		url = Networks.findOne({_id: tab.network}).internal.url;
	
	if (prefix == '') {
		prefixClass = '';
	} else if (prefix == '+') {
		prefixClass = ' voice';
	} else if (prefix == '%') {
		prefixClass = ' halfop';
	} else {
		prefixClass = ' op';
	}
	// setup a different colour for different prefixes

	var prefixIcon = (prefix == '') ? '&nbsp;' : prefix,
		prefixSpan = (show && prefix !== '') ? '<span class="prefix' + prefixClass + '">' + prefixIcon + '</span>' : '',
		html = '<a href="/' + url + '/' + context.message.nickname + '" rel="user-link" data-nick="' + context.message.nickname + '"  data-prefix="' + prefixIcon + '" data-username="' + context.message.username + '" data-hostname="' + context.message.hostname + '">' + prefixSpan + '<span class="name">' + context.message.nickname + '</span><span aria-hidden="true">&gt; </span></a>';
	
	return new Handlebars.SafeString(html);
	// return the element
});