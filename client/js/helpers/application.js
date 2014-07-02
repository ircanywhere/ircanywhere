Ember.Handlebars.helper('safeString', function(value, options) {
	return new Ember.Handlebars.SafeString(value);
});

Ember.Handlebars.helper('lookup', function(component, context, options) {
	if (Ember.TEMPLATES[component]) {
		Ember.TEMPLATES[component](this, options);
	} else if (component !== false) {
		console.warn('Got event, but template for:', component, 'does not exist');
	}
});

Ember.Handlebars.helper('time', function(context, options) {
	return new Date(context).format('g:i A');
});

Ember.Handlebars.registerBoundHelper('ircParse', function(text, networkId, options) {
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

Ember.Handlebars.helper('userLink', function(show, user, options) {
	var context = (user) ? user : this.get('content'),
		prefix = (!context.extra) ? context.prefix : context.extra.prefix,
		nickname = context.nickname || context.message.nickname,
		prefixClass = '',
		url = this.get('controllers.network.model').url,
		nickHash = Helpers.hashCode(nickname);

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

	prefixClass += ' nameColor_' + ((Math.abs(nickHash) % 78) + 1);
	// pick one of the 78 colors in nameColors.less for the vertical band, based on user nick

	var prefixIcon = (prefix == '') ? '&nbsp;' : prefix,
		prefixSpan = (show) ? '<span class="prefix' + prefixClass + '">' + prefixIcon + '</span>' : '',
		route = '#/t/' + url + '/' + nickname,
		html = (user) ? '<a href="' + route + '" rel="user-link" data-nick="' + nickname + '" data-prefix="' + prefixIcon + '">' + prefixSpan + '<span class="name">' + nickname + '</span></a>' : '<a href="' + route + '" rel="user-link" data-nick="' + nickname + '" data-prefix="' + prefixIcon + '">' + prefixSpan + '<span class="name">' + nickname + '</span><span aria-hidden="true">&gt; </span></a>';
	
	return new Ember.Handlebars.SafeString(html);
	// return the element
});