var Lab = require('lab'),
	helper = require('../../lib/helpers').Helpers;

Lab.experiment('Helpers', function() {
	var fakeClientObject = {
		internal: {
			capabilities: {
				channel: {
					types: '#&'
				}
			}
		}
	};

	var uncleanObject = {
		_id: {
			'_bsontype': 'fakemongoid'
		},
		subObject: {
			_id: {
				'_bsontype': 'fakemongoid'
			},
		},
		empty: null,
		property: 1
	};

	Lab.test('exists should locate embedded properties correctly', function(done) {
		Lab.expect(helper.exists(fakeClientObject, 'internal')).to.be.a('object');
		done();
	});

	Lab.test('exists should evaluate invalid properties correctly', function(done) {
		Lab.expect(helper.exists(false, 'internally')).to.equal(false);
		Lab.expect(helper.exists(fakeClientObject, 'internally')).to.equal(false);
		done();
	});

	Lab.test('trimInput should trim properly', function(done) {
		Lab.expect(helper.trimInput(' dss  fds4  ')).to.equal('dss  fds4');
		done();
	});

	Lab.test('isValidName should check correct', function(done) {
		Lab.expect(helper.isValidName('anameshorterthan35characters')).to.equal(true);
		done();
	});

	Lab.test('isValidName should check incorrect', function(done) {
		Lab.expect(helper.isValidName('anamelongerthan35charactersandsomemore')).to.equal(false);
		done();
	});

	Lab.test('isValidNickname should check for valid nicknames', function(done) {
		Lab.expect(helper.isValidNickname('avalidnickname')).to.be.a('array');
		done();
	});

	Lab.test('isValidNickname should check for invalid nicknames', function(done) {
		Lab.expect(helper.isValidNickname('aninvalid\nickname')).to.equal(null);
		done();
	});

	Lab.test('isValidEmail should check for valid emails', function(done) {
		Lab.expect(helper.isValidEmail('a.valid.email@address.com')).to.be.a('array');
		done();
	});

	Lab.test('isValidEmail should check for invalid emails', function(done) {
		Lab.expect(helper.isValidEmail('a.valid.email@addresscom')).to.equal(null);
		done();
	});

	Lab.test('isValidPassword should check for valid passwords', function(done) {
		Lab.expect(helper.isValidPassword('short')).to.equal(false);
		done();
	});

	Lab.test('isValidPassword should check for invalid passwords', function(done) {
		Lab.expect(helper.isValidPassword('longer')).to.equal(true);
		done();
	});

	Lab.test('isChannel should check for valid channels', function(done) {
		Lab.expect(helper.isChannel(fakeClientObject, '#chan')).to.equal(true);
		Lab.expect(helper.isChannel(fakeClientObject, '&chan')).to.equal(true);
		done();
	});

	Lab.test('isChannel should check for invalid channels', function(done) {
		Lab.expect(helper.isChannel({}, 'chan')).to.equal(false);
		Lab.expect(helper.isChannel(fakeClientObject, 'chan')).to.equal(false);
		done();
	});

	Lab.test('encodeChannel should encode channel names properly', function(done) {
		Lab.expect(helper.encodeChannel('#chan')).to.equal('%23chan');
		Lab.expect(helper.encodeChannel('##chan')).to.equal('%23%23chan');
		done();
	});

	Lab.test('decodeChannel should encode channel names properly', function(done) {
		Lab.expect(helper.decodeChannel('%23chan')).to.equal('#chan');
		Lab.expect(helper.decodeChannel('%23%23chan')).to.equal('##chan');
		done();
	});

	Lab.test('escape should escape values properly', function(done) {
		Lab.expect(helper.escape('this.should.be.escaped')).to.equal('this\\.should\\.be\\.escaped');
		done();
	});

	Lab.test('cleanObjectIds should clean objects properly', function(done) {
		Lab.expect(helper.cleanObjectIds(uncleanObject)._id).to.equal('[object Object]');
		Lab.expect(helper.cleanObjectIds(uncleanObject)._bsontype).to.not.exist;
		done();
	});

	Lab.test('generateSalt should generate valid salts', function(done) {
		Lab.expect(helper.generateSalt(10)).to.have.length(10);
		Lab.expect(helper.generateSalt(10)).to.match(/[a-zA-Z0-9]/);
		done();
	});
});