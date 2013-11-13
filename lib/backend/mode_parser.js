/* ============================================================
 * IRCAnywhere
 * ============================================================
 * 
 * (C) Copyright 2011 - 2012 IRCAnywhere (https://ircanywhere.com)
 * All Rights Reserved.
 * 
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 *
 * ============================================================ */

exports.ModeParser = {};

/*
 * ModeParser::sortModes
 *
 * Sorts a mode string into parameters
 */
exports.ModeParser.sortModes = function(extra, modes)
{
	var params = [],
		splitModes = [],
		omodes = modes;

	if (modes.charAt(0) != '+' && modes.charAt(0) != '-')
		modes = '+' + modes;

	if (modes.indexOf(' ') >= 0)
	{
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

	for (var num = 0; num < splitModes.length; num++)
	{
		var mode = splitModes[num];
		if (mode == '+')
		{
			modeType = 'plus';
			continue;
		}
		else if (mode == '-')
		{
			modeType = 'minus';
			continue;
		}
		// set the modeType to plus or minus

		if (modeType == null)
			continue;
		// this shouldn't occur but if it does just bail

		if (extra.paramModesUn != undefined && extra.paramModesUn.indexOf(mode) >= 0 && modeType == 'minus')
			modes[modeType] += mode;
		else if (extra.paramModesUn != undefined && extra.paramModes.indexOf(mode) >= 0)
			params.push((modeType == 'plus' ? '+' + mode : '-' + mode));
		else
			modes[modeType] += mode;
	}

	var length = modes.params.length;
	if (length > 0)
	{
		for (var num = 0; num < modes.params.length; num++)
		{
			var param = modes.params[num],
				mode = params[num];
			
			if (newParams[param] == undefined)
				newParams[param] = {plus: '', minus: ''};

			if (mode != undefined && mode.charAt(0) == '+')
				newParams[param].plus += mode.replace('+', '');
			else if (mode != undefined && mode.charAt(0) == '-')
				newParams[param].minus += mode.replace('-', '');
		}
		// go through each parameter and find the mode
		// that comes with it

		modes.params = newParams;
	}

	return modes;
};

/*
 * ModeParser::appendModes
 *
 * A function to append the modes correctly
 */
exports.ModeParser.changeModes = function(storage, extra, modeArray)
{
	if (modeArray.plus != '')
	{
		var arr = modeArray.plus.split();
		for (var pos = 0; pos < arr.length; pos++)
		{
			var mode = arr[pos];
			if (storage.modes.indexOf(mode) == -1)
				storage.modes += mode;
		}
	}
	// we have plus modes? add them to the channel string

	if (modeArray.minus != '')
	{
		var arr = modeArray.plus.split();
		for (var pos = 0; pos < arr.length; pos++)
		{
			var mode = arr[pos],
				parts = storage.modes.split(' ');

			if (parts[0].indexOf(mode) >= 0)
			{
				var nStr = '',
					splitParts = parts[0].split('');

				for (var rmi = 0; rmi < splitParts.length; rmi++)
				{
					var rm = splitParts[rmi];
					if (extra.paramModesUn.indexOf(rm) >= 0)
						nStr += rm;
				}
				// build a string of modes to remove.

				var strPos = nStr.indexOf(mode);
				if (strPos >= 0)
					parts.splice(strPos + 1, 1);
				// find the location of the parameter

				parts[0] = parts[0].replace(mode, '');
				storage.modes = parts.join(' ');
				// remove the mode and param
			}
			// remove the mode (-)
		}
	}
	// handle minus modes

	for (var param in modeArray.params)
	{
		if (modeArray.params[param].plus != '')
		{
			var plusSplit = modeArray.params[param].plus.split('');
			for (var pmi in plusSplit)
			{
				var pm = plusSplit[pmi];

				if (extra.statusModes.indexOf(pm) >= 0 || extra.restrictModes.indexOf(pm) >= 0)
					continue;
				// ignore these modes, handled elsewhere

				var parts = storage.modes.split(' '),
					strPos = parts[0].indexOf(pm);

				if (strPos >= 0)
				{
					parts[0] = parts[0].replace(pm, '');
					parts.splice(pmi + 1, 1);
				}
				// it exists, lets replace it
				
				parts[0] += pm;
				parts.push(param);
				// lets add it

				storage.modes = parts.join(' ');
				// remove the mode and param
			}
		}
		// handle plus modes

		if (modeArray.params[param].minus != '')
		{
			var minusSplit = modeArray.params[param].minus.split('');
			for (var mmi in minusSplit)
			{
				var mm = minusSplit[mmi];

				if (extra.statusModes.indexOf(mm) >= 0 || extra.restrictModes.indexOf(mm) >= 0)
					continue;
				// ignore these modes, handled elsewhere

				var parts = storage.modes.split(' '),
					strPos = parts[0].indexOf(mm);

				if (strPos >= 0)
				{
					parts[0] = parts[0].replace(mm, '');
					parts.splice(pmi + 1, 1);
				}
				// it exists, lets replace it

				storage.modes = parts.join(' ');
				// remove the mode and param
			}
		}
		// handle minus modes
	}
	// handle modes with unrequired parameters, such as flj

	return storage.modes;
};

/*
 * ModeParser::handleParams
 *
 * A function to append the parameter modes correctly
 */
exports.ModeParser.handleParams = function(storage, extra, modeArray)
{
	storage.changedUsers = [];

	for (var param in modeArray.params)
	{
		var user = storage.users[param.toLowerCase()];
		if (user != undefined)
		{
			var changed = false;

			if (modeArray.params[param].plus != '')
			{
				var plusSplit = modeArray.params[param].plus.split('');
				for (var pmi in plusSplit)
				{
					var pm = plusSplit[pmi];

					if (extra.statusModes.indexOf(pm) == -1)
						continue;
					// we've found a user but be careful, this could still
					// be a key, with the name of a user

					if (user.modes.indexOf(pm) == -1)
						user.modes += pm;
					changed = true;
				}
			}
			// loop throug the plus modes

			if (modeArray.params[param].minus != '')
			{
				var minusSplit = modeArray.params[param].minus.split('');
				for (var mmi in minusSplit)
				{
					var mm = minusSplit[mmi];

					if (extra.statusModes.indexOf(mm) == -1)
						continue;
					// we've found a user but be careful, this could still
					// be a key, with the name of a user

					if (user.modes.indexOf(mm) >= 0)
						user.modes = user.modes.replace(mm, '');
					changed = true;
				}
			}
			// loop through the plus modes

			if (changed)
			{
				var newString = '';

				for (var i = 0; i < extra.statusModes.length; i++)
				{
					var mode = extra.statusModes[i];

					if (user.modes.indexOf(mode) >= 0)
						newString += mode;
				}

				user.modes = newString;
				// replace the modes

				if (user.modes.length > 0)
				{
					var mode = extra.statusModes.indexOf(user.modes.charAt(0));
					user.prefix = extra.statusPrefix[mode];
				}
				else
				{
					user.prefix = '';
				}
				// change the prefix

				storage.changedUsers.push(user);
			}
			// sort the modes	
		}
		// determine if the parameter is a nick, based on what our
		// user list for this channel looks like.

		// TODO - Ban list and exception list etc another time
	}
	// handle modes with required on and off parameters
	// ie status modes and restriction modes, also keys

	return storage.changedUsers;
};

/*
 * ModeParser::convertToPrefix
 *
 * A function to convert prefixes to frontend prefix strings
 */
exports.ModeParser.convertToPrefix = function(extra, user, string)
{
	var ret = {
		user: user,
		prefix: '',
		modes: ''
	};

	if (extra.statusPrefix == undefined)
		return;

	for (i = 0; i < extra.statusPrefix.length; i++)
	{
		var prefix = extra.statusPrefix[i];

		if (string.indexOf(prefix) >= 0)
			ret.modes += extra.statusModes[i];

		if (ret.prefix == '' && ret.modes != '' && string.indexOf(prefix) >= 0)
			ret.prefix += prefix;
		else
			ret.prefix == '';
	}

	return ret;
};