var crypto = require('crypto'),
	ipem = require('ipevents'),
	keyObjects = [];

var hashObject = function(object)
{
	var json = JSON.stringify(object),
		key = crypto.createHash('md5').update(json).digest('hex');

	return key;
}

for (var i = 0; i < 10; i++)
{
	var ircobject = {
			server: 'irc.ircanywhere.com',
			nick: 'nodebot-' + i,
			channels: ['#irca-log']
		};

	if (i == 6)
	{
		ircobject.server = 'www.google.com';
		ircobject.port = 80;
	}

	keyObjects.push({
		key: hashObject(ircobject),
		object: ircobject
	});
}
// create a hundred key objects

ipem
	.options({
		restart: true,
		delayRestart: 0,
		useSocket: true,
		socket: {
			onlyConnect: true,
			socketPath: null,
			port: 7200,
			host: 'localhost',
			reconnect: true,
			delayReconnect: 1000
		}
	})
	.on('connected', function()
	{
		if (typeof keyObjects != 'object')
			return;

		for (var i in keyObjects)
			ipem.sendTo([this.from], 'initial validate', keyObjects[i]);
	})
	.on('initial validate', function(keyobj, valid)
	{
		if (valid === true)
		{
			//ipem.sendTo([this.from], 'rpc', keyobj.key, 'say', ['#irca-log', 'reconnected']);
			// we have a valid key, lets test it out
		}
		else
		{
			ipem.sendTo([this.from], 'create', keyobj);
			// we dont have a valid key, request to create a new client
		}
	})
	.on('destroyed', function(key)
	{
		console.log('client destroyed', key);
	})
	.on('failed', function(key)
	{
		console.log('client failed', key);
	})
	.on('created', function(keyobj)
	{
		var _this = this;
		console.log('client created', keyobj.key);
	})
	.on('irc', function(key, e, args)
	{
		console.log('irc: ', e, args);
		// node-irc events forwarded to this one
	})
	.on('rpc', function(command, result)
	{
		console.log(command, result);
	})
	.on('error', function(error)
	{
		console.log(error);
	})
	.start();