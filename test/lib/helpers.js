var helper = require('../../lib/helpers').Helpers,
	expect = require('chai').expect;

describe('Helpers', function() {
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

	it('exists should locate embedded properties correctly', function(done) {
		expect(helper.exists(fakeClientObject, 'internal')).to.be.a('object');
		done();
	});

	it('exists should evaluate invalid properties correctly', function(done) {
		expect(helper.exists(false, 'internally')).to.equal(false);
		expect(helper.exists(fakeClientObject, 'internally')).to.equal(false);
		done();
	});

	it('trimInput should trim properly', function(done) {
		expect(helper.trimInput(' dss  fds4  ')).to.equal('dss  fds4');
		done();
	});

	it('isValidName should check correct', function(done) {
		expect(helper.isValidName('anameshorterthan35characters')).to.equal(true);
		done();
	});

	it('isValidName should check incorrect', function(done) {
		expect(helper.isValidName('anamelongerthan35charactersandsomemore')).to.equal(false);
		done();
	});

	it('isValidNickname should check for valid nicknames', function(done) {
		expect(helper.isValidNickname('avalidnickname')).to.be.a('array');
		done();
	});

	it('isValidNickname should check for invalid nicknames', function(done) {
		expect(helper.isValidNickname('aninvalid\nickname')).to.equal(null);
		done();
	});

	it('isValidEmail should check for valid emails', function(done) {
		expect(helper.isValidEmail('a.valid.email@address.com')).to.be.a('array');
		done();
	});

	it('isValidEmail should check for invalid emails', function(done) {
		expect(helper.isValidEmail('a.valid.email@addresscom')).to.equal(null);
		done();
	});

	it('isValidPassword should check for valid passwords', function(done) {
		expect(helper.isValidPassword('short')).to.equal(false);
		done();
	});

	it('isValidPassword should check for invalid passwords', function(done) {
		expect(helper.isValidPassword('longer')).to.equal(true);
		done();
	});

	it('isChannel should check for valid channels', function(done) {
		expect(helper.isChannel(fakeClientObject, '#chan')).to.equal(true);
		expect(helper.isChannel(fakeClientObject, '&chan')).to.equal(true);
		done();
	});

	it('isChannel should check for invalid channels', function(done) {
		expect(helper.isChannel({}, 'chan')).to.equal(false);
		expect(helper.isChannel(fakeClientObject, 'chan')).to.equal(false);
		done();
	});

	it('encodeChannel should encode channel names properly', function(done) {
		expect(helper.encodeChannel('#chan')).to.equal('%23chan');
		expect(helper.encodeChannel('##chan')).to.equal('%23%23chan');
		done();
	});

	it('decodeChannel should encode channel names properly', function(done) {
		expect(helper.decodeChannel('%23chan')).to.equal('#chan');
		expect(helper.decodeChannel('%23%23chan')).to.equal('##chan');
		done();
	});

	it('escape should escape values properly', function(done) {
		expect(helper.escape('this.should.be.escaped')).to.equal('this\\.should\\.be\\.escaped');
		done();
	});

	it('cleanObjectIds should clean objects properly', function(done) {
		expect(helper.cleanObjectIds(uncleanObject)._id).to.equal('[object Object]');
		expect(helper.cleanObjectIds(uncleanObject)._bsontype).to.not.exist;
		done();
	});

	it('generateSalt should generate valid salts', function(done) {
		expect(helper.generateSalt(10)).to.have.length(10);
		expect(helper.generateSalt(10)).to.match(/[a-zA-Z0-9]/);
		done();
	});
});