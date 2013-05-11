
exports.BufferEngine = {};
exports.BufferEngine.saveCommands = [
	'001',
	'002',
	'003',
	'RPL_MYINFO',
	'RPL_ISUPPORT',
	'RPL_LUSERCLIENT',
	'RPL_LUSEROP',
	'RPL_LUSERUNKNOWN',
	'RPL_LUSERCHANNELS',
	'RPL_LUSERME',
	'RPL_MOTDSTART',
	'RPL_MOTD',
	'RPL_ENDOFMOTD',
	'RPL_HOSTHIDDEN',
	'NOTICE',
	'JOIN',
	'PART',
	'MODE',
	'TOPIC',
	'NICK',
	'QUIT'
];
// commands to save into the buffer

var database = require('./database').Database,
	system = require('./system').System,
	server = require('./server').Server,
	ircHandler = require('./irc_handler').IrcHandler,
	parseMessage = require('../../lib/parse').parseMessage;

/*
 * BufferEngine::decodeLogJSON
 *
 * A function to decode an encrypted log json block
 */
exports.BufferEngine.decodeLogJSON = function(code)
{
	"use strict";

	var decoded = new Buffer(code, 'base64').toString('utf8');
	// decode the buffer data

	return decoded;
};

/*
 * BufferEngine::escape
 *
 * A function to escape a string ready for inputting into regex
 */
exports.BufferEngine.escape = function(text)
{
	"use strict";

	return text.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
};

/*
 * BufferEngine::determineHighlight
 *
 * A function to determine whether a string should be a highlight
 */
exports.BufferEngine.determineHighlight = function(account, network, ours, text)
{
	"use strict";

	var regex = server.client_data[account].highlight_regex + this.escape(server.client_data[account].networks[network].nick) + ')';

	if (!ours && text.match(new RegExp(regex, 'i')))
	{
		return true;
	}
	// does it match?

	return false;
};

/*
 * BufferEngine::compileOutgoing
 *
 * Compile an outgoing data object
 */
exports.BufferEngine.compileOutgoing = function(account, network, data)
{
	"use strict";

	var outgoing = {};
		
	outgoing.network = network;
	outgoing.time = (outgoing.time === undefined) ? new Date().toString() : outgoing.time.toString();
	outgoing.read = false;

	if (typeof data === 'string')
	{
		data = parseMessage(data, false);
	}
	// if the type is string then convert it to a valid message object

	var nick = (data.nick === undefined) ? '*' : data.nick.toLowerCase(),
		target = (data.args[0] === undefined) ? server.client_data[account].networks[network].nick : data.args[0].toLowerCase(),
		networkName = server.client_data[account].networks[network].name,
		channelObject = (ircHandler.channels[networkName] === undefined) ? undefined : (ircHandler.channels[networkName][target] === undefined) ? undefined: ircHandler.channels[networkName][target];

	outgoing.self = (data.nick == server.client_data[account].networks[network].nick) ? true : false;
	outgoing.target = target;
	outgoing.highlight = (data.command === 'PRIVMSG' && this.determineHighlight(account, network, false, data.args.slice(1).join(' '))) ? true : false;
	outgoing.userPrefix = (channelObject === undefined) ? 'Z' : ((channelObject.users[nick] === undefined) ? 'Z' : channelObject.users[nick].prefix);
	
	for (var k in data)
	{
		if (data.hasOwnProperty(k))
		{
			outgoing[k] = data[k];
		}
	}
	// transfer some settings.

	var dubPrefix = String(outgoing.prefix);
		outgoing.prefix = (dubPrefix.indexOf('!') > -1) ? dubPrefix.split('!')[1] : outgoing.prefix;
	// remove the (Ricki!) part from prefix's (Ricki!jim@host.com)

	return outgoing;
};

/*
 * BufferEngine::saveLogs
 *
 * Saves the data to the log table 
 */
exports.BufferEngine.saveLogs = function(account, network, outgo, ours)
{
	"use strict";

	var outgoing = {};
	for (var k in outgo)
	{
		if (outgo.hasOwnProperty(k))
		{
			outgoing[k] = outgo[k];
		}
	}

	var _this = this,
		nArgs = outgoing.args.slice(1).join(' ');
		outgoing.command = (outgoing.command === undefined) ? '' : outgoing.command.toUpperCase();

	if (_this.saveCommands.indexOf(outgoing.command) > -1 || (outgoing.args[0] !== '*' && outgoing.command === 'PRIVMSG' && !/^\u0001(?:(?!ACTION).)*\u0001/.test(nArgs)))
	{
		delete outgoing.network;
		delete outgoing.read;
		// remove these we don't need them right here

		var timestamp = +new Date(outgoing.time),
			encoded = new Buffer(outgoing.line, 'utf8').toString('base64');
		// encode the line

		var nick = (outgoing.nick === undefined) ? '*' : outgoing.nick.toLowerCase(),
			target = (outgoing.command === 'QUIT' || outgoing.command === 'NICK') ? outgoing.args[0].toLowerCase() : outgoing.target.toLowerCase(),
			networkName = server.client_data[account].networks[network].name,
			channelObject = (ircHandler.channels[networkName] === undefined) ? undefined : (ircHandler.channels[networkName][target] === undefined) ? undefined: ircHandler.channels[networkName][target];
			// setup some other variables

		var status = (ircHandler.isChannel(account, network, outgoing.args[0]) || outgoing.command === 'PRIVMSG') ? false : true,
			type = (ircHandler.isChannel(account, network, outgoing.args[0])) ? 'chan-' + outgoing.args[0].substr(1) : 'query-' + outgoing.args[0],
			tabId = network + '-' + type,
			read = (!status) ? ((server.client_data[account].tab !== tabId || !server.client_data[account].active) ? false : true) : false;
			read = (nick === '*' || outgoing.args[0].substr(0, 3) === '***') ? true : read;
			// setup tab id and determine whether we mark this as read
		
		var buffer = new database.bufferModel();
		// setup the log object

		buffer.userPrefix = (channelObject === undefined) ? 'Z' : ((channelObject.users[nick] === undefined) ? 'Z' : channelObject.users[nick].prefix);
		buffer.account = account;
		buffer.network = network;
		buffer.timestamp = timestamp;
		buffer.status = status;
		buffer.privmsg = (outgoing.command === 'PRIVMSG') ? true : false;
		buffer.read = read;
		buffer.nick = nick;
		buffer.target = target;
		buffer.self = ours;
		buffer.highlight = (buffer.privmsg && _this.determineHighlight(account, network, ours, outgoing.args.slice(1).join(' '))) ? true : false;
		buffer.json = encoded;
		buffer.save();
		// populate the buffer with some fields

		return buffer._id;
	}

	return null;
};

/*
 * BufferEngine::getStatusBacklog
 *
 * Load the status backlog and fire it back to the client
 */
exports.BufferEngine.getStatusBacklog = function(socket, user, key)
{
	"use strict";

	var _this = this;

	function fakeObject(time, prefix, server, command)
	{
		return {
			account: user,
			network: key,
			time: time,
			read: false,
			prefix: prefix,
			server: server,
			command: command,
			rawCommand: command,
			args: []
		};
	}
	// a function to return a default object

	database.bufferModel.find({account: user, network: key, status: true}).sort({'timestamp': -1}).limit(100).exec(function(err, results)
	{
		var logReturn = [],
			unreadPrivmsgs = [],
			counter = 0,
			lcNick = server.client_data[user].networks[key].nick.toLowerCase();

		results.reverse();
		for (var rkey in results)
		{
			if (results.hasOwnProperty(rkey))
			{
				var json = parseMessage(_this.decodeLogJSON(results[rkey].json), false);
				// get log json

				if (json.rawCommand === '001')
				{
					logReturn.push(fakeObject(json.time, json.prefix, json.server, 'CONNECT_BANNER'));
				}

				if (json.command === 'NOTICE' && (json.args.length === 2 && json.args[0] === '*' && json.args[1] === '*** Looking up your hostname...'))
				{
					logReturn.push(fakeObject(json.time, json.prefix, json.server, 'CONNECTING_BANNER'));
					// insert the connect banner
					
					if (counter > 0 && results[counter - 1] !== undefined)
					{
						logReturn.push(fakeObject(json.time, json.prefix, json.server, 'DISCONNECT_BANNER'));
					}
					// we do this if here is a next item in the array to process, which means we've reconnected
				}
				// if the command is NOTICE AUTH :*** Looking up your hostname...
				// add an identifier called reconnect banner

				json.time = new Date(results[rkey].timestamp);
				json.userPrefix = results[rkey].userPrefix;
				json.account = user;
				json.network = key;
				json._id = results[rkey]._id;
				json.read = (results[rkey].nick === '*' || json.args[0].substr(0, 3) === '***') ? true : results[rkey].read;
				json.self = results[rkey].self;
				// replace a bunch of json data

				logReturn.push(json);
				// insert the log data

				counter++;
			}
		}

		database.bufferModel.find({account: user, network: key, read: false, privmsg: true, status: false, target: lcNick}).sort({'timestamp': 1}).exec(function(err, privmsgResults)
		{
			for (var rkey in privmsgResults)
			{
				if (privmsgResults.hasOwnProperty(rkey))
				{
					var json = parseMessage(_this.decodeLogJSON(privmsgResults[rkey].json), false);
					// get log json

					unreadPrivmsgs.push(json.nick);
				}
			}

			var hash = user + key + lcNick;
			server.createHTTPChunk(socket, hash, 'backlog', {network: key, status: true, unreadPrivmsgs: unreadPrivmsgs, messages: logReturn, topId: null});
			// all done.
		});
		// find out if we have any unread privmsgs
	});
};

/*
 * BufferEngine::getMoreBacklog
 *
 * Load a backlog and fire it back to the client
 */
exports.BufferEngine.getMoreBacklog = function(socket, user, data, query)
{
	"use strict";

	var _this = this,
		clone = {};

	for (var keys = Object.keys(query), l = keys.length; l; --l)
	{
		clone[keys[l-1]] = query[keys[l-1]];
	}

	clone.read = false;
	clone.privmsg = true;
	// clone and alter query

	function fakeObject(network, target)
	{
		return {
			network: network,
			target: target,
			status: false,
			messages: []
		};
	}

	database.bufferModel.count(clone, function(err, count)
	{
		var returnData = fakeObject(data.network, data.target);
		
		if (count > 0)
		{
			returnData.unreadMessages = count;
			database.bufferModel.findOne(clone, {'_id': 1}).sort({'timestamp': 1}).exec(function (err, row) {
				returnData.firstUnread = row._id;
			});

			clone.highlight = true;
			database.bufferModel.count(clone, function(err, highlightCount) {
				returnData.highlightCount = highlightCount;
			});
		}
		// there is more than one. get the id of the first one

		database.bufferModel.find(query).sort({'timestamp': -1}).limit(data.limit).exec(function(err, results)
		{
			var counter = 0,
				status = data.status;

			for (var rkey in results)
			{
				if (results.hasOwnProperty(rkey))
				{
					var json = parseMessage(_this.decodeLogJSON(results[rkey].json), false);
					// get log json

					json.time = new Date(results[rkey].timestamp);
					json.userPrefix = results[rkey].userPrefix;
					json.account = user;
					json.network = data.network;
					json._id = results[rkey]._id;
					json.read = results[rkey].read;
					json.self = results[rkey].self;
					json.highlight = results[rkey].highlight;
					// replace a bunch of json data

					returnData.messages.push(json);
					// insert the log data

					if (results[rkey].privmsg)
					{
						counter++;
					}
					
					if (results[rkey].status)
					{
						status = true;
					}
				}
			}

			if (count > 0 && counter > count)
			{
				returnData.remainingMessages = count - counter;
			}
			else
			{
				returnData.remainingMessages = count;
			}
			
			if (status)
			{
				returnData.unreadPrivmsgs = [];
			}

			returnData.topId = data.id;
			returnData.status = status;

			var hash = user + data.network + data.target + server.client_data[user].networks[data.network].nick.toLowerCase();
			server.createHTTPChunk(socket, hash, 'backlog', returnData);
		});
		// right, once that is done we'll actually compile a list of all the messages now
	});
	// get number of unread messages
};

/*
 * BufferEngine::removeExpiredMessages
 *
 * Remove expired messages based on what the account object says
 */
exports.BufferEngine.removeExpiredMessages = function()
{
	for (var account in server.client_data)
	{
		var user = server.client_data[account];

		if (user.account_type == undefined || user.account_type.opt == undefined || user.account_type.opt.maxLogs == undefined || user.account_type.opt.maxLogs == 0)
			continue;
		// skip them if maxLogs isnt defined

		var timestamp = (user.account_type.opt.maxLogs * 86400) * 1000,
			now = +new Date(),
			before = ceil(now - timestamp);
		// get the timestamp for maxLogs days ago

		database.bufferModel.remove({account: account, timestamp: {'$lt': before}}, function(err) {});
		// delete buffers older than before
	}
};