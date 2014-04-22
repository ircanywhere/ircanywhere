var pkg = require('./package.json'),
	npm = require('npm'),
	cp = require('child_process'),
	readline = require('readline'),
	os = require('os'),
	fs = require('fs'),
	util = require('util');

pkg.loglevel = 'error';

npm.load(pkg, function(err) {
	if (err) {
		throw err;
	}

	try {
		var gulp = require('gulp');
	} catch (e) {
		util.log('\033[31mYou need to install gulp first `sudo npm install -g gulp`\033[0m');
		process.exit(1);
	}

	util.log('\033[32mLoaded package.json!\033[0m');
	installNpmDeps();
	
	function installNpmDeps() {
		util.log('\033[34mInstalling npm dependencies...\033[0m');

		npm.commands.install(function(err) {
			if (err) {
				throw err;
			}

			util.log('\033[32mInstalled all dependencies!\033[0m');
			mongoDbSetup();
		});
		// install npm dependencies
	}

	function mongoDbSetup() {
		util.log('\033[34mChecking for MongoDB installation...\033[0m');

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

			if (!local) {
				var path = stdout.split(' ')[1];
			} else {
				var path = './build/mongodb/bin/mongod';
			}
			// get the proper path

			util.log('\033[32mFound MongoDB at ' + path + '!\033[0m');

			isMongoRunning(local, path);
		});
		// we need to check if mongodb is setup properly
	}

	function isMongoRunning(local, path) {
		var mongo = require('mongodb').MongoClient,
			opts = {},
			dbPath = (local) ? './build/mongodb/db' : '/data/db',
			logFile = (local) ? './build/mongodb/mongodb.log' : '/var/log/mongodb.log';

		if (local && !fs.existsSync('./build/mongodb/db')) {
			fs.mkdirSync('./build/mongodb/db');
		}
		// make a data dir if it doesnt exist

		if (local) {
			opts = {stdio: 'inherit'};
		} else {
			opts = {uid: 0, stdio: 'inherit'};
		}

		mongo.connect('mongodb://127.0.0.1:27017', function(err, db) {
			if (err) {
				util.log('\033[34mStarting MongoDB process with oplog tailing. If this is your own MongoDB installation it might require some configuration...\033[0m');
				cp.spawn(path, ['--logpath', logFile, '--dbpath', dbPath, '--replSet', 'rs0', '--fork'], opts).on('close', function(code) {
					if (code === 0) {
						setTimeout(function() {
							isMongoRunning(local, path);
						}, 2000);
					} else if (code === 100) {
						util.log('\033[31mStartup failed, will try a repair.\033[0m');
						repairMongoDb(dbPath, logFile, path);
					} else if (code === 1) {
						util.log('\033[31mStartup failed, try running as sudo.\033[0m');
						process.exit(1);
					}
				});
			} else {
				util.log('\033[34mChecking if a replica set is configured for oplog tailing...\033[0m');
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
			util.log('\033[34mNot found a configuration, setting one up...\033[0m');
			util.log('\033[34mThis should be done manually and properly in a production environment!\033[0m');
				
			db.command({replSetInitiate: null}, function(err, result) {
				if (err === null || (result !== null && result.ok === 1)) {
					doneInstalling(db, result);
				} else {
					console.log(err, result);
					util.log('\033[31mrs.initiate() failed. Needs manual intervention.\033[0m');
				}
			});
		}

		function repairMongoDb(dbPath, logFile, path) {
			var child = cp.spawn(path, ['--logpath', logFile, '--dbpath', dbPath, '--repair', '--fork'], opts);
			
			child.on('close', function(code) {
				if (code === 0) {
					util.log('\033[32mRepair was successful!\033[0m');
					setTimeout(function() {
						isMongoRunning(local, path);
					}, 2000);
				} else if (code === 1) {
					util.log('\033[31mRepair failed, try running as sudo.\033[0m');
					process.exit(1);
				}
			});
		}

		function doneInstalling(db, result) {
			if (result !== null && result.ok === 1) {
				util.log('\033[32mMongoDB setup complete...\033[0m');
				db.close();
				runGulp();
			}
		}
	}

	function installMongoDb() {
		var rl = readline.createInterface(process.stdin, process.stdout),
			install = false;
		
		util.log('\033[31mYou need to install MongoDB. I can install it locally for you?\033[0m');
		
		rl.setPrompt('(yes/no) > ');
		rl.prompt();
		rl.on('line', function(line) {
			line = line.toLowerCase();

			if (line === 'yes' || line === 'y') {
				install = true;
				rl.close();
			} else if (line === 'no' || line === 'n') {
				install = false;
				rl.close();
			} else {
				rl.prompt();
			}
		}).on('close', function() {
			if (install) {
				installPrompt();
			} else {
				dontInstall();
			}
		});
		// prompt the user with a "(yes/no) > " to see if they want us to install mongodb locally

		function installPrompt() {
			if (os.platform() !== 'linux') {
				util.log('\033[31mI can\'t currently install MongoDB for you on non linux platforms, you will need to do this yourself\033[0m');
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
				util.log('\033[34mDownloading ' + ((x64) ? '64' : '32' ) + 'bit version of MongoDB...\033[0m');

				var path = 'http://fastdl.mongodb.org/linux/' + filename + '.tgz',
					wget = cp.spawn('wget', [path, '--directory-prefix=./build'], {stdio: 'inherit'});

				wget.on('close', function(code) {
					if (code === 0) {
						untarAndInstall(x64, filename);
					}
				});
			}
		}

		function untarAndInstall(x64, filename) {
			util.log('\033[34mUntarring build/' + filename + '.tgz...\033[0m');
			
			var tar = cp.spawn('tar', ['-xzf', 'build/' + filename + '.tgz', '-C', './build', '--transform', 's/' + filename + '/mongodb/'], {stdio: 'inherit'});

			tar.on('close', function(code) {
				if (code !== 0) {
					return false;
				}

				util.log('\033[32mMongoDB is now locally installed at ./build/mongodb\033[0m');
				util.log('\033[34mFor production use it\'s recommended you move the files from ./build/mongodb/bin to a location in your $PATH such as /usr/local/bin. MongoDB will be automatically started with oplog tailing enabled, although for production use this will have to be done manually which will require reading the documentation at http://ircanywhere.readthedocs.org/en/latest/pre_requirements.html#installing-mongodb and skipping to the configuration section.\033[0m');
			
				isMongoRunning(true, './build/mongodb/bin/mongod');
			});
		}

		function dontInstall() {
			util.log('\033[33mOK, continuing, but you wont be able to run ircanywhere without a proper mongodb setup!\033[0m');
			runGulp();
		}
	}

	function runGulp() {
		util.log('\033[34mCompiling client side-files...\033[0m');
		var child = cp.exec('gulp', function(error, stdout, stderr) {
			if (err) {
				throw err;
			}

			util.log('\033[32mCompiled client-side files!\033[0m');
			done();
		});
	}

	function done() {
		util.log('\033[32mEverything is ready to go!\033[0m');
		util.log('\033[34mRun ircanywhere with `node . run` or `node . start` to fork the process.\033[0m');
	}
});
// first lets run npm install and get our dependencies