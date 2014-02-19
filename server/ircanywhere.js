var daemon = require('daemonize2').setup({
	main: './main.js',
	name: 'ircanywhere',
	pidfile: '../ircanywhere.pid',
	cwd: './'
});

switch (process.argv[2]) {
	case 'run':
		require('./main.js');
		break;
	case 'start':
		daemon.start();
		break;
	case 'stop':
		daemon.stop();
		break;
	case 'restart':
		daemon.stop(function(err) {
			daemon.start();
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
		console.log('Usage: [run|start|stop|restart|status]');
}