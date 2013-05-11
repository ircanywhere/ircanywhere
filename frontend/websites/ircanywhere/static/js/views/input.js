var InputView = Backbone.View.extend({

	tagName: 'input',
	id: 'chat',
	
	attributes: {
		name: 'chat',
		type: 'text',
		tabindex: '1'
	},

	setValue: function(value)
	{
		this.$el.val(value);
	},

	getValue: function()
	{
		return this.$el.val();
	},

	events: {
		'keydown': 'onKeyDown'
	},

	onKeyDown: function(e)
	{
		var keyCode = e.keyCode || e.which,
			key = { enter: 13, up: 38, down: 40, tab: 9 },
			tab = tabCollections.getByCid(selectedTab);

		if (userInfo.networks == undefined || selectedNet == null || tab == undefined || tab.get('disabled'))
			return;

		if (keyCode == key.enter && loggedIn)
		{
			var value = this.getValue(),
				buffer = tab.get('buffer');
			
			buffer.unshift(value);
			tab.set({buffer: buffer});
			// add the line to the buffer

			this.send(tab, value);
			this.setValue('');
			// send the item and reset the chat box

			e.preventDefault();
		}
		else if (keyCode == key.tab)
		{
			var users = tab.get('ulCollection').models,
				newId = tab.get('newId'),
				newInputs = tab.get('newInputs'),
				input = this.getValue(),
				currentInputs = input.split(' '),
				currentInput = currentInputs.pop().replace(client.settings.autocompletion, '').trim();

			if (input.trim() == '')
				return;
			// empty string

			if (newId == 0)
				tab.set({defaultInput: input});

			if (newInputs.length == 0)
			{
				var newInputs = [];
				for (var i = 1; i < users.length; i++)
				{
					var user = users[i].user,
						regex = new RegExp('^' + $.escape(currentInput) + '(.*)', 'i');

					if (user.match(regex))
						newInputs.push(users[i].user);
				}

				tab.set({newInputs: newInputs});
			}	
			// loop through the users checking them for matches

			if (newId < newInputs.length)
			{
				var defaultInputs = tab.get('defaultInput').split(' ');
					newId = (newId < 0 || newId > newInputs.length) ? 0 : newId + 1;
				tab.set({newId: newId});

				if (defaultInputs.length == 1)
				{
					this.setValue(newInputs[newId - 1] + client.settings.autocompletion + ' ');
				}
				else
				{
					defaultInputs.pop();
					// knock the last element off

					var firstPart = (defaultInputs.length > 0) ? defaultInputs.join(' ') + ' ' : '',
						secondPart = client.settings.autocompletion + ' ';
					// split the string up and pop the end off

					this.setValue(firstPart + newInputs[newId - 1] + secondPart);
				}
			}
			// loop through the current nicks for the last word
			else if (newId == newInputs.length)
			{
				newId = 0;
				tab.set({newId: newId, newInputs: []});
				
				this.setValue(tab.get('defaultInput'));
				// replace the orignal string info
			}
			// loop back round to the start

			e.preventDefault();
		}
		else if (keyCode == key.up)
		{
			var buffer = tab.get('buffer'),
				bufferIndex = tab.get('bufferIndex');
			
			if (bufferIndex < 0 || buffer[bufferIndex + 1] != undefined)
				this.setValue(buffer[++bufferIndex]);
			
			tab.set({bufferIndex: bufferIndex});
			// on key up, retrieve earlier messages

			e.preventDefault();
		}
		else if (keyCode == key.down)
		{
			var buffer = tab.get('buffer'),
				bufferIndex = tab.get('bufferIndex');

			if (bufferIndex < 0)
				this.setValue('');
			else
				this.setValue(buffer[--bufferIndex]);

			tab.set({bufferIndex: bufferIndex});
			// on key down, retrieve later messages

			e.preventDefault();
		}
	},

	/* 
	 * handleCommand
	 * 
	 * handle typed commands like (/j)
	 */
	handleCommand: function(command)
	{
		var split = command.split(' '),
			newData = split.slice(1),
			rCommand = split[0].toLowerCase();

		if (userInfo.networks[selectedNet].status == 'connected')
		{
			if (rCommand == 'msg' || rCommand == 'privmsg')
			{
				this.sendPrivMsg(newData[0], newData.slice(1).join(' '), false);
				
				return true;
			}
			else if (rCommand == 'notice')
			{
				client.socket.emit('data', {network: selectedNet, command: 'NOTICE ' + newData[0] + ' :' + newData.slice(1).join(' ')});
				
				return true;
			}
			else if (rCommand == 'me')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				this.sendPrivMsg(selectedChan, newData.join(' '), true, false);
				
				return true;
			}
			else if (rCommand == 'nick')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				client.socket.emit('data', {network: selectedNet, command: 'NICK ' + newData[0]});
				// send the command

				return true;
			}
			else if (rCommand == 'topic')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				client.socket.emit('data', {network: selectedNet, command: 'TOPIC ' + newData.join(' ')});
				// send the command

				return true;
			}
			else if (rCommand == 'mode')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				client.socket.emit('data', {network: selectedNet, command: 'MODE ' + newData.join(' ')});
				//send the command

				return true;
			}
			else if (rCommand == 'quit' || rCommand == 'disconnect')
			{
				client.socket.emit('disconnectNetwork', {network: selectedNet});
				// disconnect this way, not by using QUIT
			}
			else if (rCommand == 'query' || rCommand == 'q')
			{
				if (Helper.isChannel(userInfo.networks[selectedNet], newData[0]))
					return false;
				// make sure newData[0] isnt a channel

				var tabId = actions.createWindow(selectedNet, newData[0], 'query');
				actions.selectTab(tabId);
				// create a window
				
				return true;
			}
			else if (rCommand == 'close')
			{
				var tab = tabCollections.getByCid(selectedTab);
				if ((tab.get('type') != 'window' && tab.get('disabled')) || (tab.get('type') != 'window' && !tab.get('type') != 'chan') || (tab.get('type') != 'window' && !tab.get('disabled') && tab.get('type') != 'chan'))
					actions.destroyWindow(selectedTab, true);
				
				return true;
			}
			else if (rCommand == 'j' || rCommand == 'join')
			{
				client.socket.emit('data', {network: selectedNet, command: 'JOIN ' + newData.join(' ')});
				
				return true;
			}
			else if (rCommand == 'cycle' || rCommand == 'hop')
			{
				client.socket.emit('data', {network: selectedNet, command: 'PART ' + selectedChan});
				client.socket.emit('data', {network: selectedNet, command: 'JOIN ' + selectedChan});
				
				return true;
			}
			else if (rCommand == 'part' || rCommand == 'leave' || rCommand == 'p')
			{
				var chan = newData[0] || selectedChan;
				client.socket.emit('data', {network: selectedNet, command: 'PART ' + chan});
				
				return true;
			}
			else if (rCommand == 'invite')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				var nickname = newData[0],
					channel = newData[1] || selectedChan;
				client.socket.emit('data', {network: selectedNet, command: 'INVITE ' + nickname + ' ' + channel});
				
				return true;
			}
			else if (rCommand == 'kick' || rCommand == 'kickban')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				var tab = tabCollections.getByCid(selectedTab),
					nickname = newData[0].toLowerCase(),
					user = tab.get('ulCollection').filter(function(model) {
						if (model.get('user') != undefined)
							return model.get('user').toLowerCase() == nickname;
					});
					host = (user[0] == undefined) ? nickname : user[0].hostname;
					reason = newData.slice(1).join(' ') || '';

				if (rCommand == 'kickban')
					client.socket.emit('data', {network: selectedNet, command: 'MODE ' + ' ' + selectedChan + ' +b ' + host});
				
				client.socket.emit('data', {network: selectedNet, command: 'KICK ' + selectedChan + ' ' + nickname + ' ' + reason});
				
				return true;
			}
			else if (rCommand == 'ban' || rCommand == 'unban')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				var mask = newData[0],
					mode = (rCommand == 'ban') ? '+b' : '-b';
				client.socket.emit('data', {network: selectedNet, command: 'MODE ' + selectedChan + ' ' + mode + ' ' + mask});
				
				return true;
			}
			else if (rCommand == 'list')
			{
				client.socket.emit('getChanList', {network: selectedNet});
				
				return true;
			}
			else if (rCommand == 'links')
			{
				var tabId = mem[selectedNet + '-other-links'],
					tab = tabCollections.getByCid(selectedTab);

				this.setValue('');
				tab.set({storedInput: ''});
				// clear this, for some reason its sticking
				
				if (tabId == undefined)
				{
					tabId = actions.createWindow(selectedNet, '/links', 'other');
					tab = tabCollections.getByCid(tabId);
				}
				
				actions.selectTab(tabId);

				tab.$table.empty().append('<thead><tr class="heading"><th>Server / Hub</th><th>Description</th></tr></thead><tbody></tbody>');
				// if the table is empty, add a heading row

				client.socket.emit('data', {network: selectedNet, command: 'LINKS'});
				
				return true;
			}
			else if (rCommand == 'away')
			{
				var message = (newData[0] == '') ? '' : ' :' + newData.join(' ');
				client.socket.emit('data', {network: selectedNet, command: 'AWAY' + message});
				
				return true;
			}
			else if (rCommand == 'raw' || rCommand == 'quote')
			{
				if (newData.join(' ') == '') return true;

				client.socket.emit('data', {network: selectedNet, command: newData.join(' ')});
				
				return true;
			}
			// commands to evaluate when connected
		}
		else
		{
			if (rCommand == 'connect' || rCommand == 'reconnect')
			{
				client.socket.emit('connectNetwork', {network: selectedNet});
				return true;
				// reconnect
			}
			// commands to execute when disconnected
		}
		
		return false;
	},

	send: function(tab, text)
	{
		if (text != null && text.length > 0)
		{
			if (text.substr(0, 1) != '/' && (selectedChan != '' && selectedChan != undefined) || (text.substr(0, 2) == '//'))
			{
				if (tab.get('type') == 'window' || tab.get('type') == 'other')
					return;
				
				this.sendPrivMsg(selectedChan, text, false, false);
			}
			// not a command, send it straight out :3
			else if (text.substr(0, 1) == '/' && text.substr(1, 1) != '/')
			{
				if (!this.handleCommand(text.substr(1)))
					client.socket.emit('data', {network: selectedNet, command: text.substr(1)});
			}
			// seems to be a / command
		}
	},

	sendPrivMsg: function(chan, text, action)
	{
		if (text.substr(0, 2) == '//') text = text.substr(1);
		text = (!action) ? text : '\u0001ACTION ' + text + '\u0001';
		// if it's // just strip the first / off and send it :3
		
		client.socket.emit('data', {network: selectedNet, command: 'PRIVMSG ' + chan + ' :' + text});
	}
});