Ember.Handlebars.helper('json', function(value, options) {
	console.log(value);
	return 'null';
});

Ember.Handlebars.helper('lookup', function(component, context, options) {
	if (Ember.TEMPLATES[component]) {
		Ember.TEMPLATES[component](this, options);
	} else {
		console.warn('Got event, but template for:', component, 'does not exist');
	}
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

Ember.Handlebars.registerBoundHelper('ircParse', function(text, options) {
	var network = this.get('controllers.network.model');
	return new Ember.Handlebars.SafeString(App.Parser.exec(text, network));
});

Ember.Handlebars.registerHelper('group', function(options) {
	var data = options.data,
		fn = options.fn,
		view = data.view,
		childView;

	childView = view.createChildView(Ember._MetamorphView, {
		context: Ember.get(view, 'context'),

		template: function(context, options) {
			options.data.insideGroup = true;
			return fn(context, options);
		}
	});

	view.appendChild(childView);
});

Ember.Handlebars.helper('userLink', function(show, user, options) {
	var context = (user) ? user : this.get('content'),
		prefix = (!context.extra) ? context.prefix : context.extra.prefix,
		nickname = context.nickname || context.message.nickname,
		username = context.username || context.message.username,
		hostname = context.hostname || context.message.hostname,
		prefixClass = '',
		url = this.get('controllers.network.model').url;

	if (!nickname) {
		return '';
	}
	
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
		route = '#/t/' + url + '/' + nickname,
		html = (user) ? '<a href="' + route + '" rel="user-link" data-nick="' + nickname + '" data-prefix="' + prefixIcon + '" data-username="' + username + '" data-hostname="' + hostname + '">' + prefixSpan + '<span class="name">' + nickname + '</span></a>' : '<a href="' + route + '" rel="user-link" data-nick="' + nickname + '" data-prefix="' + prefixIcon + '" data-username="' + username + '" data-hostname="' + hostname + '">' + prefixSpan + '<span class="name">' + nickname + '</span><span aria-hidden="true">&gt; </span></a>';
	
	return new Ember.Handlebars.SafeString(html);
	// return the element
});