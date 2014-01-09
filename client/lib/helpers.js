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
	var prefix = (!context.extra) ? context.prefix : context.extra.prefix,
		nickname = context.nickname || context.message.nickname,
		username = context.username || context.message.username,
		hostname = context.hostname || context.message.hostname,
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
		prefixSpan = (show) ? '<span class="prefix' + prefixClass + '">' + prefixIcon + '</span>' : '',
		html = '<a href="/' + url + '/' + nickname + '" rel="user-link" data-nick="' + nickname + '"  data-prefix="' + prefixIcon + '" data-username="' + username + '" data-hostname="' + hostname + '">' + prefixSpan + '<span class="name">' + nickname + '</span><span aria-hidden="true">&gt; </span></a>';
	
	return new Handlebars.SafeString(html);
	// return the element
});

Handlebars.registerHelper('showEvent', function(tab, options) {
	return (tab.hiddenEvents) ? 'hide' : '';
});

Handlebars.registerHelper('equals', function(v1, v2, options) {
	return (v1 == v2);
});

Handlebars.registerHelper('ircParse', function(text, tab, options) {
	var network = Networks.findOne({_id: tab.network}),
		message = IRCParser.exec(text, network);

	return new Handlebars.SafeString(message);
});