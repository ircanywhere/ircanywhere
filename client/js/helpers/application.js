Ember.Handlebars.helper('json', function(value, options) {
	return JSON.stringify(value.content);
});

Ember.Handlebars.helper('time', function(context, options) {
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

Ember.Handlebars.helper('userLink', function(show, options) {
	var context = this.get('content'),
		prefix = (!context.extra) ? context.prefix : context.extra.prefix,
		nickname = context.nickname || context.message.nickname,
		username = context.username || context.message.username,
		hostname = context.hostname || context.message.hostname,
		prefixClass = '',
		url = this.get('controllers.tab.model').url;
	
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
		route = '/t/' + url + '/' + nickname,
		html = Ember.Handlebars.compile('<a href="' + route + '" {{action visitLink}} rel="user-link" data-nick="' + nickname + '"  data-prefix="' + prefixIcon + '" data-username="' + username + '" data-hostname="' + hostname + '">' + prefixSpan + '<span class="name">' + nickname + '</span><span aria-hidden="true">&gt; </span></a>');
	
	return html(null, options);
	// return the element
});