var fs = require('fs'),
	pidLocation = __dirname + '/../irc-factory.pid';

var daemon = require('daemonize2').setup({
	main: './main.js',
	name: 'ircanywhere',
	pidfile: '../ircanywhere.pid',
	cwd: './'
});

switch (process.argv[2]) {
	case 'run':
		fs.writeFile(__dirname + '/../ircanywhere.pid', process.pid);
		require('./main.js');
		break;
	case 'start':
		daemon.start();
		break;
	case 'stop':
		daemon.stop();
		break;
	case 'stop-factory':
		fs.readFile(pidLocation, function(err, pid) {
			if (err) {
				console.log('irc-factory is not running.');
				process.exit(1);
			}

			process.kill(pid, 'SIGTERM');
		});
		break;
	case 'stop-all':
		fs.readFile(pidLocation, function(err, pid) {
			if (err) {
				daemon.stop();
				console.log('irc-factory is not running.');
				process.exit(1);
			} else {
				daemon.stop();
				process.kill(pid, 'SIGTERM');
			}			
		});
		break;
	case 'restart':
		daemon.stop(function() {
			daemon.start();
		});
		break;
	case 'restart-all':
		daemon.stop(function() {
			fs.readFile(pidLocation, function(err, pid) {
				if (err) {
					daemon.start();

					console.log('irc-factory is not running.');
					process.exit(1);
				} else {
					process.kill(pid, 'SIGTERM');
					setTimeout(function() {
						daemon.start();
					}, 500);
				}
			});
		});
		break;
	case 'status':
		var pid = daemon.status();
		if (pid) {
			console.log('ircanywhere daemon is running. PID: ' + pid);
		} else {
			console.log('ircanywhere daemon is not running.');
		}
		break;
	default:
		console.log('Usage: [run|start|stop|stop-factory|stop-all|restart|restart-all|status]');
}