var Lab = require('lab'),
	ChannelManager = require('../../server/channels').ChannelManager,
	mongo = require('mongodb');
	fibrous = require('fibrous');

channelManager = new ChannelManager;
application = {};
Clients = {};

Lab.experiment('ChannelManager', function() {
	var clientId = new mongo.ObjectID('533c6855c44ef5be620df839'),
		networkId = new mongo.ObjectID('52fa3256268029eb2a1b0b2d');
	
	Lab.before(function(done) {
		mongo.MongoClient.connect('mongodb://test:ircanywhere@oceanic.mongohq.com:10040/tests', function(err, db) {
			if (err) {
				throw err;
			}

			application.Tabs = db.collection('tabs');
			application.Networks = db.collection('networks');
			application.ChannelUsers = db.collection('channelUsers');
			// setup our collections

			application.Networks.find({}).each(function(err, network) {
				Clients[network._id] = network;
			});
			// setup Clients

			done();
		});
	});

	Lab.test('getChannel should return a valid channel object', function(done) {
		fibrous.run(function() {
			Lab.expect(channelManager.getChannel(networkId, 'freenode')).to.be.a('object');
			done();
		});
	});

	Lab.test('getChannel should create a new channel object', function(done) {
		fibrous.run(function() {
			Lab.expect(channelManager.getChannel(networkId, '#ircanywhere').modes).to.equal('');
			done();
		});
	});

	Lab.test('insertUsers should correctly insert a set of users', function(done) {
		var users = [
			{
				"username" : "~ia1",
				"hostname" : "84.19.105.28",
				"nickname" : "rickibalboa-",

			},
			{
				"username" : "~ricki",
				"hostname" : "unaffiliated/rickibalboa",
				"nickname" : "rickibalboa"
			}
		];

		fibrous.run(function() {
			Lab.expect(channelManager.insertUsers(clientId, networkId, '#ircanywhere', users, true)).to.equal('');
			done();
		});
	});
});