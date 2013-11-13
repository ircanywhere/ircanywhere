var express = require('express'),
	derby = require('derby'),
	racerBrowserChannel = require('racer-browserchannel'),
	liveDbMongo = require('livedb-mongo'),
	MongoStore = require('connect-mongo')(express),
	app = require('../app'),
	error = require('./error'),
	defconf = require('../../config.json');

var Server = {
	redisUrl: '',
	redis: {},
	mongoUrl: '',
	store: {},
	expressApp: express()
};

Server.setupRedis = function()
{
	if (defconf.redis.hostname)
	{
		this.redis = require('redis').createClient(defconf.redis.port, defconf.redis.hostname);
		this.redis.auth(defconf.redis.password);
	}
	else if (defconf.redis.cloud_url != '')
	{
		this.redisUrl = require('url').parse(defconf.redis.hostname);
		this.redis = require('redis').createClient(this.redisUrl.port, this.redisUrl.hostname);
		this.redis.auth(redisUrl.auth.split(":")[1]);
	}
	else
	{
		this.redis = require('redis').createClient();
	}
	// setup redis

	this.redis.select(process.env.REDIS_DB || 1);
}

Server.setupMongo = function()
{
	var _this = this;

	this.mongoUrl = defconf.database;
	this.store = derby.createStore({
		db:
		{
			db: liveDbMongo(_this.mongoUrl + '?auto_reconnect', {safe: true}),
			redis: _this.redis
		}
	});
	// the store creates models and syncs data
}

Server.setupExpress = function()
{
	var _this = this;

	function createUserId(req, res, next)
	{
		var model = req.getModel(),
			userId = req.session.userId || (req.session.userId = model.id());
		
		model.set('_session.userId', userId);
		next();
	}

	this.expressApp
		.use(express.favicon())
		// Gzip dynamically
		.use(express.compress())
		// Respond to requests for application script bundles
		.use(app.scripts(this.store))
		// Serve static files from the public directory
		// .use(express.static(__dirname + '/../../public'))

		// Add browserchannel client-side scripts to model bundles created by store,
		// and return middleware for responding to remote client messages
		.use(racerBrowserChannel(this.store))
		// Add req.getModel() method
		.use(this.store.modelMiddleware())

		// Parse form data
		// .use(express.bodyParser())
		// .use(express.methodOverride())

		// Session middleware
		.use(express.cookieParser())
		.use(express.session({
			secret: process.env.SESSION_SECRET || 'YOUR SECRET HERE',
			store: new MongoStore({url: _this.mongoUrl, safe: true})
		}))
		.use(createUserId)

		// Create an express middleware from the app's routes
		.use(app.router())
		.use(this.expressApp.router)
		.use(error());


	// SERVER-SIDE ROUTES //

	this.expressApp.all('*', function(req, res, next) {
		next('404: ' + req.url);
	});
}

Server.setupRedis();
Server.setupMongo();
Server.setupExpress();
// run all our startups

module.exports = Server.expressApp;