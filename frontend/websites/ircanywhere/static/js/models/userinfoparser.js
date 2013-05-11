UserInfoParser = Backbone.Model.extend({
	
	incoming: function(data)
	{
		userInfo.account_type = data.account_type;
		userInfo.ident = data.ident;
		userInfo.ip = data.ip;
		userInfo.is_connected = (data.is_connected == undefined) ? false : data.is_connected;
		userInfo.logged_in = data.logged_in;
		userInfo.realname = data.real;
		userInfo.nickname = data.nick;
	},

	networks: function(data)
	{
		userInfo.networks = {};
		
		for (var network in data)
			this.addNetwork(network, data[network], false, function() {});
		// handle incoming userinfo.

		if ($.isEmptyObject(userInfo.networks[network]) && connected)
		{
			client.showNoNetworks().hideLoading();
			Backbone.history.start();
		}
		// no networks? handle this and do not proceed
		else
		{
			client.hideNoNetworks();
			if (window.location.hash == '' || window.location.hash == '#' || window.location.hash == '#!/')
				actions.selectTab(tabCollections.at(0).get('id'));
			// show everything
		}
		// there are networks, carry on sir.
	},

	addNetwork: function(network, networkInfo, now, callback)
	{
		var tabdata = {},
            tabId = '',
            alphabetStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            userInfo.networks[network] = networkInfo,
            extra = (now) ? {scrollLock: true} : {scrollLock: false};

		if (networkInfo.extra != undefined)
		{
			networkInfo.extra.orderedStatusPrefix = {};
			for (var i in networkInfo.extra.statusPrefix)
				networkInfo.extra.orderedStatusPrefix[networkInfo.extra.statusPrefix[i]] = alphabetStr.charAt(i);
		}
		// convert !/~/&/@/%/+ etc into a/b/c/d/e/f so they can be alphabetically ordered.

		if (netinfo[network] !== undefined)
		{
			tab = tabCollections.filter(function(tab) { return tab.get('rId') == network + '-window' })[0];
			
			if (networkInfo.status == 'connected')
				tab.$link.find('a:first-child span.link').text(networkInfo.name);
			
			callback();
			return {};
		}
		// network already exists, thats fine. bail!

		$('div#sidebar div#network').append($('<ul id="network-' + $.fastEncode(network) + '"></ul>'));
		tabId = actions.createWindow(network, networkInfo.name, 'window', extra);
		newData = true;
		
		if (networkInfo.status == 'connected')
		{
			for (var chan in networkInfo.chans)
				tabId = actions.createWindow(network, chan, 'chan', extra);
		}
		// we're connected, so just open the channel windows.

		netinfo[network] = networkInfo;
		tabdata.network = network;
		tabdata.chan = chan;
		tabdata.tabId = tabId;

		callback();

		return tabdata;
	}
});

var userInfoParser = new UserInfoParser();