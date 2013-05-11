var replyFor = require('./codes');

/*
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 */
exports.parseMessage = function(line, stripColors)
{
	var message = {};
	var match;

	if (stripColors)
		line = line.replace(/[\x02\x1f\x16\x0f]|\x03\d{0,2}(?:,\d{0,2})?/g, "");

	message.time = new Date();
	message.line = line;
	// Parse prefix
	if (match = line.match(/^:([^ ]+) +/))
	{
		message.prefix = match[1];
		line = line.replace(/^:[^ ]+ +/, '');
		if (match = message.prefix.match(/^([^ !]*)(!([^@]+)@(.*))?$/))
		{
			message.nick = match[1];
			message.user = match[3];
			message.host = match[4];
		}
		else
		{
			message.server = message.prefix;
		}
	}

	// Parse command
	if (match = line.match(/^([^ ]+) */))
	{
		message.command = match[1];
		message.rawCommand = match[1];
		message.commandType = 'normal';
		line = line.replace(/^[^ ]+ +/, '');
	}

	if (replyFor[message.rawCommand])
	{
		message.command = replyFor[message.rawCommand].name;
		message.commandType = replyFor[message.rawCommand].type;
	}

	message.args = [];
	var middle, trailing;

	// Parse parameters
	if (line.search(/^:|\s+:/) != -1)
	{
		match = line.match(/(.*?)(?:^:|\s+:)(.*)/);
		middle = match[1].trimRight();
		trailing = match[2];
	}
	else
	{
		middle = line;
	}

	if (middle.length)
		message.args = middle.split(/ +/);

	if (typeof (trailing) != 'undefined' && trailing.length)
		message.args.push(trailing);

	return message;
};
