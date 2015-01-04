Ember.Handlebars.helper('json', function(value) {
	console.log(JSON.stringify(value, undefined, 2));
});

Ember.Handlebars.helper('safeString', function(value) {
	return new Ember.Handlebars.SafeString(value);
});

Ember.Handlebars.helper('time', function(context) {
	return new Date(context).toLocaleTimeString();
});

Ember.Handlebars.registerBoundHelper('ircParse', function(text, networkId) {
	var network = this.get('controllers.network.socket.networks').findBy('_id', networkId);
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

Ember.Handlebars.helper('motd', function(messages) {
	var str = '',
		network = this.get('parentController.parentController.content');

	messages.forEach(function(text) {
		str += App.Parser.exec(text, network) + '<br />';
	});

	return new Ember.Handlebars.SafeString(str);
});

function generateUserLink(show, user) {
	var context = (user) ? user : this.get('content'),
		prefix = (!context.extra) ? context.prefix : context.extra.prefix,
		nickname = context.nickname || context.message.nickname,
		prefixClass = '',
		url = this.get('controllers.network.model.url');

	if (!nickname) {
		return '';
	}
	
	if (prefix === '') {
		prefixClass = '';
	} else if (prefix == '+') {
		prefixClass = ' voice';
	} else if (prefix == '%') {
		prefixClass = ' halfop';
	} else {
		prefixClass = ' op';
	}
	// setup a different colour for different prefixes

	var prefixIcon = (prefix === '') ? '&nbsp;' : prefix,
		prefixSpan = (show) ? '<span class="prefix' + prefixClass + '">' + prefixIcon + '</span>' : '',
		route = '#/t/' + url + '/' + nickname,
		html = (user) ? '<a href="' + route + '" rel="user-link" data-nick="' + nickname + '" data-prefix="' + prefixIcon + '">' + prefixSpan + '<span class="name">' + nickname + '</span></a>' : '<a href="' + route + '" rel="user-link" data-nick="' + nickname + '" data-prefix="' + prefixIcon + '">' + prefixSpan + '<span class="name">' + nickname + '</span><span aria-hidden="true">&gt; </span></a>';
	
	return new Ember.Handlebars.SafeString(html);
	// return the element
};

Ember.Handlebars.helper('userLink', generateUserLink);