var Workspace = Backbone.Router.extend({

	routes: {
		'!/:network/*chan': 'chan',
		'!/:network': 'network',

		'?/add-network': 'addNetwork',
		'?/settings': 'settings',
		'?/edit-network/:network': 'editNetwork'
	},

	updateHash: function(hash)
	{
		if (previousHashes.length == 0 || hash != previousHashes[previousHashes.length - 1])
            previousHashes.push(hash);
        if (previousHashes.length > 10)
            previousHashes.shift();
        // update previousHashes
	},

	loadStatic: function(page, background, execute)
	{
		execute = execute || null;
		if (tabCollections.getByCid(selectedTab) != undefined)
			tabCollections.getByCid(selectedTab).get('view').hide();
		// hide current tab

		//if (userInfo.is_connected && (userInfo.networks.length == 0 || userInfo.networks == undefined))
		//	return;
		// TODO - Revise

		client.showLoading();
		$.get(page, function(data)
		{
			if (background)
				$('div#home-content').addClass('home-background').show();
			else
				$('div#home-content').removeClass('home-background').show();

			$('div#channel-window-data').hide();
			client.hideLoading();

			$('div#home-content div.content').html(data);

			if (execute != null)
				execute();
		});
		// load the desired page
	},

	addNetwork: function()
	{
		if (client.socket == null)
		{
			$('div#channel-input, div#home-content, div#no-networks').hide();
			$('div#not-connected').show();
		}
		else
		{
			this.loadStatic('/network', true, function()
			{
				$('div#footer div.link').addClass('selected');
				tabCollections.changeTopicBar('Add Network', '', '', '');
				
				//$('div#home-content div#edit-warning').html('<p>You are on a free plan and have one network left to join. Please consider upgrading for raised limits.</p>').show();
				$('div#home-content div#edit-warning').remove();
				$('div#home-content input#server-nickname').val(userInfo.nickname);
				$('div#home-content input#server-realname').val(userInfo.realname);
			});
			// show the add network form :3
		}
	},

	settings: function()
	{
		tabCollections.changeTopicBar('Settings', '', '', '');
		this.loadStatic('/settings', true);
	},

	editNetwork: function(network)
	{
		if (client.socket == null) return $('div#not-connected').show();

		var network = $.findNetworkFromId(network),
			networkData = userInfo.networks[network];
			editNet = network;

		if (networkData == undefined) return;
		// doesn't exit, let's bail.

		this.loadStatic('/network', true, function()
		{
			tabCollections.changeTopicBar('Edit Network', networkData.name, '', '');

			$('form#network-form').attr('data-content', 'edit-network');
			$('div#home-content input[type=submit]').show().val('Update');
			$('div#home-content h3').text('Edit ' + networkData.name);
			$('div#home-content form#network-form').reset();
			$('div#home-content input#submit-type').val('edit-network');
			$('div#home-content div#edit-warning').html('<p>You will be reconnected upon updating connection information.</p>').show();
			// clear the network form and update modal info

			if (networkData.secure)
				$('div#home-content input#server-secure').attr('checked', 'checked').parents('.add-on').addClass('active');
			
			$('div#home-content input#server-hostname').val(networkData.host);
			$('div#home-content input#server-port').val(networkData.port);
			$('div#home-content input#server-nickname').val(networkData.nick);
			$('div#home-content input#server-password').val(networkData.password);
			$('div#home-content input#server-realname').val(networkData.real);
			$('div#home-content textarea#autojoin-chans').val(networkData.autojoin_chans);
			$('div#home-content textarea#connect-commands').val(networkData.connect_commands);
			// populate form fields

			$('div#home-content div#connect-error').addClass('hide');
			// we use the same form for add/edit network but just alter it slightly

			if (!userInfo.account_type.canRemove && networkData.locked)
			{
				$('div#home-content div#edit-warning').hide();
				$('div#home-content div#connect-error').empty().html('<p>You are on a free account and this network is locked which means you cannot edit it\'s connection settings.</p>').show();
				$('div#home-content input#server-hostname').attr('disabled', 'disabled');
			}
		});
		// show the network form
	},

	network: function(network)
	{
		var found = false;
		
		tabCollections.each(function(tab)
		{
			var netinfoN = userInfo.networks[tab.get('network')];
				exists = (netinfoN == undefined || netinfoN.url != network) ? false : true;

			if (exists)
			{
				var tabId = mem[tab.get('network') + '-window'];
				actions.selectTab(tabId);
				this.updateHash(tabId);
				found = true;
				return false;
			}
			// find the network
		}.bind(this));
		// traverse our tabs

		if (!found)
		{
			if (tabCollections.length > 0)
			{
				var tab = tabCollections.at(0);
				actions.selectTab(tab.get('id'));
				this.updateHash(tab.get('id'));
			}
			// if we have tabs then boom, show the first one
			else if (connected)
				client.showNetworks().hideLoading();
			// otherwise show the no networks page
		}
		// if we havent found a matching tab
	},

	chan: function(network, chan)
	{
		var netExists = null,
			found = false;

		tabCollections.each(function(tab)
		{
			var netinfoN = userInfo.networks[tab.get('network')];
				exists = (netinfoN == undefined || netinfoN.url != network) ? false : true,
				chan = Helper.decodeChannel(chan).replace('@', '/');

			if (exists)
				netExists = tab.get('network');

			if (exists && (tab.get('name') == chan.toLowerCase()))
			{
				var delim = (Helper.isChannel(netinfoN, tab.get('name'))) ? '-chan-' + tab.get('name').substr(1) : '-query-' + tab.get('name'),
					delim = (tab.get('name').substr(0, 1) == '/') ? '-other-' + tab.get('name').substr(1) : delim,
					tabId = mem[tab.get('network') + delim];

				actions.selectTab(tabId);
				this.updateHash(tabId);
				found = true;
				return false;
			}
			// find the network

		}.bind(this));
		// traverse our tabs

		if (netExists == null)
		{
			if (tabCollections.length > 0)
			{
				var tab = tabCollections.at(0);
				actions.selectTab(tab.get('id'));
				this.updateHash(tab.get('id'));
			}
			// if we have tabs then boom, show the first one
			else if (connected)
				client.showNoNetworks().hideLoading();
			// otherwise show the no networks page
		}

		if (netExists != null && !found)
		{
			if (Helper.isChannel(userInfo.networks[netExists], chan))
			{
				client.socket.emit('data', {network: netExists, command: 'JOIN ' + Helper.decodeChannel(chan)});
			}
			else
			{
				var newTab = actions.createWindow(netExists, chan, 'query');
				actions.selectTab(newTab);
			}
		}
		// if we haven't found a matching tab
	}
});

var appRouter = new Workspace;