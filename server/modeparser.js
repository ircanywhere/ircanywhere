/**
 * IRCAnywhere server/modeparser.js
 *
 * @title ModeParser
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var _ = require('lodash');

/**
 * Responsible for parsing mode strings into unstandable actions
 * and also responsible for applying those actions to a channel/user object.
 * 
 * None of these functions can be hooked onto or extended seen as though it's just not
 * needed and could be malicious if people are altering mode string, bugs relating to this
 * are difficult to find, if you want to hook a mode change hook to IRCHandler.mode_change()
 * 
 * @class ModeParser
 * @method ModeParser
 * @return void
 */
function ModeParser() {

}

/**
 * Sorts a mode string into an object of instructions that we can use to perform actions
 * based on what the mode string suggests, ie apply operator to 'someone', or set +m on the channel
 *
 * @method sortModes
 * @param {Object} capabilities A valid capabilities object from a client
 * @param {String} modes A mode string `+no-v rickibalboa Gnasher`
 * @return {Object} A valid modeArray object
 */
ModeParser.prototype.sortModes = function(capabilities, modes) {
	var params = [],
		splitModes = [],
		omodes = modes;

	if (modes.charAt(0) != '+' && modes.charAt(0) != '-') {
		modes = '+' + modes;
	}

	if (modes.indexOf(' ') >= 0) {
		params = modes.split(' ');
		modes = params[0];
		params.shift();
	}
	// split the mode string into modes and params.

	splitModes = modes.split('');
	
	var modes = {
			plus: '',
			minus: '',
			params: (params.length == 0 || params[0] == '') ? {} : params
		},
		modeType = null,
		newParams = [],
		paramCount = 1;
		params = [];
	// set some variables

	for (var num = 0; num < splitModes.length; num++) {
		var mode = splitModes[num];
		if (mode == '+') {
			modeType = 'plus';
			continue;
		} else if (mode == '-') {
			modeType = 'minus';
			continue;
		}
		// set the modeType to plus or minus

		if (modeType == null) {
			continue;
		}
		// this shouldn't occur but if it does just bail

		if (capabilities.types && capabilities.types.c && capabilities.types.c.indexOf(mode) >= 0 && modeType == 'minus') {
			modes[modeType] += mode;
		} else if (capabilities.param && capabilities.param.indexOf(mode) >= 0) {
			params.push((modeType == 'plus' ? '+' + mode : '-' + mode));
		} else {
			modes[modeType] += mode;
		}
	}

	var length = modes.params.length;
	if (length > 0) {
		for (var num = 0; num < length; num++) {
			var param = modes.params[num],
				mode = params[num];
			
			if (!_.has(newParams, param)) {
				newParams[param] = {plus: '', minus: ''};
			}
			
			if (_.has(params, num) && mode.charAt(0) == '+') {
				newParams[param].plus += mode.replace('+', '');
			} else if (_.has(params, num) && mode.charAt(0) == '-') {
				newParams[param].minus += mode.replace('-', '');
			}
		}
		// go through each parameter and find the mode
		// that comes with it

		modes.params = newParams;
	}

	return modes;
}

/**
 * Handles the object of instructions returned from sortModes, and applies them
 *
 * @method changeModes
 * @param {Object} capabilities A valid capabilities object from a client
 * @param {Object} modes The current mode string for the channel (not including all parameters)
 * @param {Object} modeArray A valid modeArray object from `sortModes()`
 * @return {String} The channel mode string with the changes applied.
 */
ModeParser.prototype.changeModes = function(capabilities, modes, modeArray) {
	var prefixModes = _.keys(capabilities.prefixmodes),
		modes = modes || '';
	
	if (modeArray.plus != '') {
		var arr = modeArray.plus.split();
		for (var pos = 0; pos < arr.length; pos++) {
			var mode = arr[pos];
			if (modes.indexOf(mode) == -1) {
				modes += mode;
			}
		}
	}
	// we have plus modes? add them to the channel string

	if (modeArray.minus != '') {
		var arr = modeArray.minus.split();
		for (var pos = 0; pos < arr.length; pos++) {
			var mode = arr[pos],
				parts = modes.split(' ');

			if (parts[0].indexOf(mode) >= 0) {
				var nStr = '',
					splitParts = parts[0].split('');

				for (var rmi = 0; rmi < splitParts.length; rmi++) {
					var rm = splitParts[rmi];
					if (capabilities.types.c.indexOf(rm) >= 0) {
						nStr += rm;
					}
				}
				// build a string of modes to remove.

				var strPos = nStr.indexOf(mode);
				if (strPos >= 0) {
					parts.splice(strPos + 1, 1);
				}
				// find the location of the parameter

				parts[0] = parts[0].replace(mode, '');
				modes = parts.join(' ');
				// remove the mode and param
			}
			// remove the mode (-)
		}
	}
	// handle minus modes

	for (var param in modeArray.params) {
		if (modeArray.params[param].plus != '') {
			var plusSplit = modeArray.params[param].plus.split('');
			for (var pmi in plusSplit) {
				var pm = plusSplit[pmi];
				
				if (prefixModes.indexOf(pm) >= 0 || capabilities.types.a.indexOf(pm) >= 0) {
					continue;
				}
				// ignore these modes, handled elsewhere

				var parts = modes.split(' '),
					strPos = parts[0].indexOf(pm);

				if (strPos >= 0) {
					parts[0] = parts[0].replace(pm, '');
					parts.splice(pmi + 1, 1);
				}
				// it exists, lets replace it
				
				parts[0] += pm;
				parts.push(param);
				// lets add it

				modes = parts.join(' ');
				// remove the mode and param
			}
		}
		// handle plus modes

		if (modeArray.params[param].minus != '') {
			var minusSplit = modeArray.params[param].minus.split('');
			for (var mmi in minusSplit) {
				var mm = minusSplit[mmi];

				if (prefixModes.indexOf(mm) >= 0 || capabilities.types.a.indexOf(mm) >= 0) {
					continue;
				}
				// ignore these modes, handled elsewhere
				
				var parts = modes.split(' '),
					strPos = parts[0].indexOf(mm);

				if (strPos >= 0) {
					parts[0] = parts[0].replace(mm, '');
					parts.splice(mmi + 1, 1);
				}
				// it exists, lets replace it

				modes = parts.join(' ');
				// remove the mode and param
			}
		}
		// handle minus modes
	}
	// handle modes with unrequired parameters, such as flj

	return modes;
}

/**
 * Applies any mode changes that contain status related modes, usually qaohv modes
 * minus: rickibalboa: -o > will remove the o flag from the nickname record
 * minus: rickibalboa: +v > will set the v flag on the nickname record
 *
 * @method handleParams
 * @param {Object} capabilities A valid capabilities object from a client
 * @param {Object} users A valid users array for a channel
 * @param {Object} modeArray A valid modeArray from `sortModes`
 * @return {Array[Object]} An array of users that have been affected by the mode change
 */
ModeParser.prototype.handleParams = function(capabilities, users, modeArray) {
	var prefixModes = _.keys(capabilities.prefixmodes),
		changedUsers = [];

	for (var param in modeArray.params) {
		if (_.has(users, param)) {
			var user = users[param];
		
			if (modeArray.params[param].plus != '') {
				var plusSplit = modeArray.params[param].plus.split('');
				for (var pmi in plusSplit) {
					var pm = plusSplit[pmi];

					if (prefixModes.indexOf(pm) == -1) {
						continue;
					}
					// we've found a user but be careful, this could still
					// be a key, with the name of a user

					if (!(pm in user.modes)) {
						user.modes[capabilities.prefixmodes[pm]] = pm;
					}
				}
			}
			// loop throug the plus modes

			if (modeArray.params[param].minus != '') {
				var minusSplit = modeArray.params[param].minus.split('');
				for (var mmi in minusSplit) {
					var mm = minusSplit[mmi];

					if (prefixModes.indexOf(mm) == -1) {
						continue;
					}
					// we've found a user but be careful, this could still
					// be a key, with the name of a user
					
					if (_.has(user.modes, capabilities.prefixmodes[mm])) {
						delete user.modes[capabilities.prefixmodes[mm]];
					}
				}
			}
			// loop through the plus modes

			changedUsers.push(user);
		}
		// determine if the parameter is a nick, based on what our
		// user list for this channel looks like.

		// XXX - Ban list and exception list etc another time. maybe? is this needed?
	}
	// handle modes with required on and off parameters
	// ie status modes and restriction modes, also keys

	return changedUsers;
}

exports.ModeParser = ModeParser;