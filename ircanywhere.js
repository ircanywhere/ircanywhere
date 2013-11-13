
var pkjson = require('./package.json'),
	async = require('async'),
	clc = require('cli-color'),
	program = require('commander'),
	forever = require('forever-monitor'),
	util = require('util'),
	fs = require('fs'),
	error = function(text) { util.log(clc.red(text)); process.exit(1) },
	warn = function(text) { util.log(clc.yellow(text)) };
	success = function(text) { util.log(clc.green(text)) },
	notice = function(text) { util.log(clc.cyanBright(text)) };

function main(argv)
{
	program
		.version(pkjson.version)
		.option('-c, --config [filename]', 'The filename of the configuration file to use', 'config.json')
		.option('-s, --stop', 'Whether to kill any running processes', false)
		.parse(argv);
	// setup the program with commander to handle any parameters and such

	if (program.stop !== undefined && program.stop)
	{
		fs.readFile('irc-factory/irc-factory.pid', 'utf8', function (err, data)
		{
			if (err == null && data != '')
				process.kill(data);
		});

		fs.readFile('irc-backend/irc-backend.pid', 'utf8', function (err, data)
		{
			if (err == null && data != '')
				process.kill(data);
		});

		fs.readFile('frontend/frontend.pid', 'utf8', function (err, data)
		{
			if (err == null && data != '')
				process.kill(data);
		});
	}
	// just stop any existing processes
	else
	{
		console.log(' ');
		console.log('       _______  ________                    __               ');
		console.log('       /  _/ _ \/ ___/ _ | ___  __ ___    __/ /  ___ _______ ');
		console.log('      _/ // , _/ /__/ __ |/ _ \/ // / |/|/ / _ \/ -_) __/ -_)');
		console.log('     /___/_/|_|\___/_/ |_/_//_/\_, /|__,__/_//_/\__/_/  \__/ ');
		console.log('                          /___/                              ');
		console.log(' ');
		console.log('          Version:', pkjson.version, ' (c) 2013 ircanywhere.com');
		console.log(' ');
		// display some fancy stuff, logo etc.

		startBackend();
		// no more 3 sequence start ups now, irc-backend boots everything needed
	}
}

function startBackend()
{
	notice('[notice] attempting to fork and start irc-backend with forever');
	var client = new (forever.Monitor)('server.js', {
		max: 3,
		silent: true,
		sourceDir: 'src/backend',
		logFile: 'logs/backend.forever.log',
		outFile: 'logs/backend.forever.log',
		errFile: 'logs/backend.error.log',
		options: [program.config]
	});

	client.on('start', function()
	{
		setTimeout(function()
		{
			success('[success] irc-backend successfully started');
			startFrontend();

		}, 3000);
	});

	client.on('exit', function ()
	{
		error('[error] irc-backend has failed to start, please check logs/backend.error.log or logs/backend.forever.log');
	});

	client.start();
}

function startFrontend()
{
	notice('[notice] attempting to fork and start frontend flask server with forever');
	var client = new (forever.Monitor)(['python', 'runserver.py'], {
		max: 3,
		silent: true,
		sourceDir: 'frontend',
		pidFile: 'frontend.pid',
		logFile: 'logs/frontend.output.log',
		outFile: 'logs/frontend.output.log',
		errFile: 'logs/frontend.output.log'
	});

	client.on('start', function()
	{
		setTimeout(function()
		{
			success('[success] frontend successfully started');
			notice('[exiting] fully started up, now exiting');
			process.exit(0);

		}, 3000);
	});

	client.on('exit', function ()
	{
		error('[error] frontend has failed to start, please check logs/frontend.output.log');
	});

	client.start();
}

main(process.argv);