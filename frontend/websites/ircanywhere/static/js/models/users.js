UserModel = Backbone.Model.extend({
	
	initialize: function(options)
	{
		if (options.user == undefined) return;

		var hash = options.cid + '-' + this.cid,
			prefix = (options.prefix == '') ? 'Z' : userInfo.networks[options.network].extra.orderedStatusPrefix[options.prefix];
		// define some variables

		var prefixIcon = (prefix == 'Z') ? '&nbsp;' : options.prefix,
			hostname = options.hostname.split('@'),
			firstMode = options.modes.charAt(0),
			className = 'user';

		if (firstMode == 'q' || firstMode == 'a' || firstMode == 'o')
			className = 'op';
		else if (firstMode == 'h')
			className = 'halfop';
		else if (firstMode == 'v')
			className = 'voice';

		this.set({sortBy: prefix + options.user.toLowerCase()});
		this.modes = options.modes;
		this.prefix = options.prefix;
		this.ident = hostname[0]
		this.hostname = hostname[1];
		this.away = options.away;
		this.user = options.user;
		// set some variables

		this.aHref = Helper.generateUserLink(options.network, this.user, this.ident, this.hostname, this.prefix, options.away, true);
		this.el = 'li#user-' + hash;
		this.$el = '<li id="user-' + hash + '" data-type="'+ className + '">' + this.aHref + '</li>';
		// create the element
	},

	userLink: function(showPrefix)
	{
		var showPrefix = (showPrefix == undefined) ? true : showPrefix,
			href = $(this.$el).find('a')[0].outerHTML;

		if (!showPrefix)
		{
			href = href.replace(/\<span class=\"(prefix|prefix[^"]+)+\"\>[^\<]+\<\/span\>/i, '');
			return href;
		}
		else
		{
			return href;
		}
	}
});