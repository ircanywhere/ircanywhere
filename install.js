var pkg = require('./package.json'),
	npm = require('npm'),
	cp = require('child_process'),
	readline = require('readline'),
	os = require('os'),
	fs = require('fs');

pkg.loglevel = 'error';

var LINE = '--------------------',
	COLOUR = {
		blue: '\033[33m[\033[0m \033[34m**\033[0m \033[33m]\033[0m',
		red: '\033[33m[\033[0m \033[31m**\033[0m \033[33m]\033[0m',
		yellow: '\033[33m[\033[0m \033[33m**\033[0m \033[33m]\033[0m',
		green: '\033[33m[\033[0m \033[32m**\033[0m \033[33m]\033[0m',
		q: '\033[33m[\033[0m \033[33m??\033[0m \033[33m]\033[0m',
	};

function spawnProcess(path, args, opts, fn) {
	var p = cp.spawn(path, args, opts);

	if (typeof fn.error === 'function') {
		p.on('error', fn.error);
	}

	if (typeof fn.close === 'function') {
		p.on('close', fn.close);
	}
}

function installNpmDeps() {
	console.log(COLOUR.blue, 'Installing npm dependencies...');

	npm.commands.install(function(err) {
		if (err) {
			throw err;
		}

		console.log(COLOUR.green, 'Installed all dependencies!');
		mongoDbSetup();
	});
	// install npm dependencies
}

function mongoDbSetup() {
	console.log(COLOUR.blue, 'Checking for MongoDB installation...');

	var child = cp.exec('whereis mongod', function(error, stdout, stderr) {
		var global = true,
			local = fs.existsSync('./build/mongodb/bin/mongod');

		if (stdout === 'mongod:\n') {
			global = false;
		}
		// it's not in the $PATH

		if (!global && !local) {
			return installMongoDb();
		}
		// its nowhere :<

		if (global) {
			var path = stdout.split(' ')[1];
		} else {
			var path = './build/mongodb/bin/mongod';
		}
		// get the proper path

		console.log(COLOUR.green, 'Found MongoDB at ' + path + '!');

		isMongoRunning(global, path);
	});
	// we need to check if mongodb is setup properly
}

function isMongoRunning(isGlobal, path) {
	var mongo = require('mongodb').MongoClient,
		opts = {},
		dbPath = (!isGlobal) ? './build/mongodb/db' : '/data/db',
		logFile = (!isGlobal) ? './build/mongodb/mongodb.log' : '/var/log/mongodb.log';

	if (isGlobal && !fs.existsSync('./build/mongodb/db')) {
		fs.mkdirSync('./build/mongodb/db');
	}
	// make a data dir if it doesnt exist

	if (isGlobal) {
		opts = {uid: 0, stdio: [0, 1]};
	} else {
		opts = {stdio: [0, 1]};
	}

	mongo.connect('mongodb://127.0.0.1:27017', function(err, db) {
		if (err) {
			console.log(COLOUR.blue, 'Starting MongoDB process. If this is your own MongoDB installation it might require some configuration...');
			console.log(LINE);

			spawnProcess(path, ['--logpath', logFile, '--dbpath', dbPath, '--replSet', 'rs0', '--fork'], opts, {
				error: function(e) {
					if (e.code === 'EPERM') {
						console.log(COLOUR.red, 'Cannot start your existing MongoDB because of a permission error, please run with elevated permissions.');
					}
					process.exit(1);
				},
				close: function(code) {
					if (code === 0) {
						console.log(LINE);
						setTimeout(function() {
							isMongoRunning(isGlobal, path);
						}, 2500);
					} else if (code === 100) {
						console.log(LINE);
						console.log(COLOUR.red, 'Startup failed, will try a repair.');
						console.log(LINE);
						repairMongoDb(dbPath, logFile, path);
					} else if (code === 1) {
						console.log(LINE);
						console.log(COLOUR.red, 'Startup failed, try running as sudo.');
						process.exit(1);
					}
				}
			});
		} else {
			console.log(COLOUR.blue, 'Checking if a replica set is configured for oplog tailing...');
			db.command({replSetGetStatus: 1}, function(err, result) {
				if ((err !== null && err.ok === 0) || (result !== null && result.ok === 0)) {
					initRs(db);
				} else {
					doneInstalling(db, result);
				}
			});
		}
	});

	function initRs(db) {
		console.log(COLOUR.blue, 'Not found a configuration, setting one up...');
		console.log(COLOUR.blue, 'This should be done manually and properly in a production environment!');
			
		db.command({replSetInitiate: null}, function(err, result) {
			if (err === null || (result !== null && result.ok === 1)) {
				doneInstalling(db, result);
			} else {
				console.log(err, result);
				console.log(COLOUR.red, 'rs.initiate() failed. Needs manual intervention.');
			}
		});
	}

	function repairMongoDb(dbPath, logFile, path) {
		spawnProcess(path, ['--logpath', logFile, '--dbpath', dbPath, '--repair', '--fork'], opts, {
			error: function(e) {
				if (e.code === 'EPERM') {
					console.log(COLOUR.red, 'Cannot repair MongoDB because of a permission error, please run with elevated permissions.');
				}
				process.exit(1);
			},
			close: function(code) {
				if (code === 0) {
					console.log(LINE);
					console.log(COLOUR.green, 'Repair was successful!');
					setTimeout(function() {
						isMongoRunning(isGlobal, path);
					}, 2500);
				} else if (code === 1) {
					console.log(LINE);
					console.log(COLOUR.red, 'Repair failed. Needs manual intervention.');
					process.exit(1);
				}
			}
		});
	}

	function doneInstalling(db, result) {
		if (result !== null && result.ok === 1) {
			console.log(COLOUR.green, 'MongoDB setup complete...');
			db.close();
			runGulp();
		}
	}
}

function installMongoDb() {
	var rl = readline.createInterface(process.stdin, process.stdout),
		q = COLOUR.q + ' You need to install MongoDB. I can install it locally for you? (yes/no) [yes]:',
		install = false;
	
	rl.setPrompt(q, q.length - 26);
	rl.prompt(true);

	rl.on('line', function(line) {
		line = line.toLowerCase().trim();

		if (line === 'yes' || line === 'y' || line === '') {
			install = true;
			rl.close();
		} else if (line === 'no' || line === 'n') {
			install = false;
			rl.close();
		} else {
			rl.prompt(true);
		}
	}).on('close', function() {
		if (install) {
			installPrompt();
		} else {
			dontInstall();
		}
	});
	// prompt the user with a y/n to see if they want us to install mongodb locally

	function installPrompt() {
		if (os.platform() !== 'linux') {
			console.log(COLOUR.red, 'I can\'t currently install MongoDB for you on non linux platforms, you will need to do this yourself.');
			process.exit(0);
		}

		var child = cp.exec('getconf LONG_BIT', function(error, stdout, stderr) {
			if (stdout === '64') {
				downloadMongo(true);
			} else {
				downloadMongo(false);
			}
		});
		// it's more reliable to us the OS's LONG_BIT because there is a bit with os.arch()
	}

	function downloadMongo(x64) {
		var filename;

		if (x64) {
			filename = 'mongodb-linux-x86_64-2.6.0';
		} else {
			filename = 'mongodb-linux-i686-2.6.0';
		}
		
		if (!fs.existsSync('./build')) {
			fs.mkdirSync('./build');
		}
		// make a tmp build dir

		if (fs.existsSync('./build/' + filename + '.tgz')) {
			untarAndInstall(x64, filename);
			// is mongodb already downloaded?
		} else {
			console.log(COLOUR.blue, 'Downloading ' + ((x64) ? '64' : '32' ) + 'bit version of MongoDB...');
			console.log(LINE);

			spawnProcess('wget', ['http://fastdl.mongodb.org/linux/' + filename + '.tgz', '--directory-prefix=./build'], {stdio: 'inherit'}, {
				close: function(code) {
					if (code === 0) {
						console.log(LINE);
						untarAndInstall(x64, filename);
					}
				}
			});
		}
	}

	function untarAndInstall(x64, filename) {
		console.log(COLOUR.blue, 'Untarring build/' + filename + '.tgz...');
		
		spawnProcess('tar', ['-xzf', 'build/' + filename + '.tgz', '-C', './build', '--transform', 's/' + filename + '/mongodb/'], {stdio: 'inherit'}, {
			close: function(code) {
				if (code !== 0) {
					return false;
				}

				console.log(COLOUR.green, 'MongoDB is now locally installed at ./build/mongodb');
				console.log(COLOUR.blue, '----');
				console.log(COLOUR.blue, 'For production use it\'s recommended you move the files from ./build/mongodb/bin to a location in your $PATH');
				console.log(COLOUR.blue, 'such as /usr/local/bin.');
				console.log(COLOUR.blue, ' ');
				console.log(COLOUR.blue, 'MongoDB will be automatically started with oplog tailing enabled, although for production use');
				console.log(COLOUR.blue, 'this will haveto be done manually which will require reading the documentation at');
				console.log(COLOUR.blue, 'http://ircanywhere.readthedocs.org/en/latest/pre_requirements.html#installing-mongodb.');
				console.log(COLOUR.blue, '----');

				isMongoRunning(true, './build/mongodb/bin/mongod');
			}
		});
	}

	function dontInstall() {
		console.log(COLOUR.yellow, 'OK, continuing, but you wont be able to run ircanywhere without a proper MongoDB setup!');
		runGulp();
	}
}

function runGulp() {
	console.log(COLOUR.blue, 'Compiling client side-files...');
	var child = cp.exec('gulp', function(error, stdout, stderr) {
		if (stderr) {
			throw stderr;
		}

		console.log(COLOUR.green, 'Compiled client-side files!');
		done();
	});
}

function done() {
	console.log(COLOUR.green, 'Everything is ready to go!');
	console.log(COLOUR.blue, 'Run ircanywhere with `node . run` or `node . start` to fork the process.');
}

console.log(COLOUR.blue, 'Welcome to the IRCAnywhere installation!');

npm.load(pkg, function(err) {
	if (err) {
		throw err;
	}

	try {
		var gulp = require('gulp');
	} catch (e) {
		console.log(COLOUR.red, 'You need to install gulp first `sudo npm install -g gulp`');
		process.exit(1);
	}

	console.log(COLOUR.green, 'Loaded package.json!');
	installNpmDeps();
});
// first lets run npm install and get our dependencies