Ember.Parser = Ember.Object.extend({
	tokens: {
		'\u0002': 'BOLD',
		'\u0011': 'MONOSPACE',
		'\u0012': 'INVERSE',
		'\u0016': 'ITALIC',
		'\u001d': 'ITALIC',
		'\u001f': 'UNDERLINE'
	},

	color: '\u0003',
	rgb: '\u0004',
	clear: '\u000f',

	color_map: {
		'00': 'white',
		'0': 'white',
		'01': 'black',
		'1': 'black',
		'02': 'navy',
		'2': 'navy',
		'03': 'green',
		'3': 'green',
		'04': 'red',
		'4': 'red',
		'05': 'maroon',
		'5': 'maroon',
		'06': 'purple',
		'6': 'purple',
		'07': 'orange',
		'7': 'orange',
		'08': 'yellow',
		'8': 'yellow',
		'09': 'lime',
		'9': 'lime',
		'10': 'teal',
		'11': 'cyan',
		'12': 'blue',
		'13': 'magenta',
		'14': 'grey',
		'15': 'silver'
	},

	tags: {
		BOLD: ['b'],
		MONOSPACE: ['tt'],
		INVERSE: ['span', 'inverse'],
		ITALIC: ['i'],
		UNDERLINE: ['u']
	},

	token_tags: {},
	token_const: {},

	init: function() {
		var c = 0,
			v, open, k;

		for (var i = 0, len = this.tags.length; i < len; i++) {
			c++;
			k = this.tags[i];

			this.token_const['OPEN_' + k] = c;

			v = this.tags[k];
			open = '<wbr><' + v[0];

			if (v[1]) {
				open += ' class="' + v[1] + '"';
			}

			open += '>';
			this.token_tags[c] = open;

			c++;
			this.token_const['CLOSE_' + k] = c;
			this.token_tags[c] = '</' + v[0] + '>';
		}
		c++;

		this.token_const.CLOSE_COLOR = c;
		this.token_tags[c] = '</span>';
	},

	lastIndexOf: function(value, array) {
		if (array.lastIndexOf) {
			return array.lastIndexOf(value);
		}

		if (!array.length) {
			return -1;
		}

		for (var i = array.length - 1; i >= 0; i--) {
			if (array[i] === value) {
				return i;
			}
		}

		return -1;
	},

	tokenize: function(text) {
		var list = [],
			state = [];

		for (var i = 0; i < text.length; i++) {
			this.parseToken(text[i], list, state);
		}

		this.clearState(list, state);
		// clear all state

		return list;
	},

	parseColor: function(chr, colorObj, list, state) {
		// <code><color> - change foreground color
		// <code><color>,<color> - change foreground and background color
		// <code><color>, - change foreground, restore default background
		// <code>,<color> - change background, restore default foreground
		// <code>, - restore default foreground and background
		// <code><text> - restore default foreground and background

		if (chr === ',' && !colorObj.bg) {
			colorObj.bg = true;
			// comma, indicates a background
		}
		else if (!isNaN(parseInt(chr, 10)) || (colorObj.rgb && chr.match(/[a-f]/))) {
			if (colorObj.bg === true) {
				colorObj.bg = chr;
			} else if (colorObj.bg) {
				if (colorObj.rgb && colorObj.bg.length === 6) {
					this.endColorParse(chr, list, state);
				} else {
					colorObj.bg += chr;
				}
			} else if (colorObj.fg) {
				if (colorObj.rgb && colorObj.fg.length === 6) {
					this.endColorParse(chr, list, state);
				} else {
					colorObj.fg += chr;
				}
			}
			else {
				colorObj.fg = chr;
			}
			// color code, store it appropriately
		}
		else {
			if (colorObj.bg === true) {
				delete colorObj.bg;
			}
			// background indicated but never specified, clear it

			if (this.isEmptyColor(colorObj)) {
				this.clearEmptyColor(list, state);
				list.push(chr);
				// color obj is empty, must have been a closer. Character starts a new string
			} else {
				this.endColorParse(chr, list, state);
				// color obj has value, end the parser and start a new string
			}
			// invalid color code character
		}
	},

	parseToken: function(chr, list, state) {
		var token = this.tokens[chr];

		if (chr == this.clear) {
			this.clearState(list, state);
		} else if (chr == this.color) {
			this.clearEmptyColor(list, state);
			list.push({});
		} else if (chr == this.rgb) {
			this.clearEmptyColor(list, state);
			list.push({rgb: true});
		} else if (token) {
			this.clearEmptyColor(list, state);
			this.pushToken(token, list, state);
		} else {
			if (list.length) {
				var prevIdx = list.length - 1;

				if (typeof list[prevIdx] == 'string') {
					list[prevIdx] += chr;
				} else if (typeof list[prevIdx] == 'object') {
					this.parseColor(chr, list[prevIdx], list, state);
				} else {
					list.push(chr);
				}
			} else {
				list.push(chr);
			}
		}
	},

	pushToken: function(token, list, state) {
		var lastStateIndex = this.lastIndexOf(token, state);

		if (lastStateIndex !== -1) {
			state.splice(lastStateIndex, 1);
			list.push(this.token_const['CLOSE_' + token]);
			// character is a close, push the code onto the list and remove state token
		} else {
			state.push(token);
			list.push(this.token_const['OPEN_' + token]);
			// character is an open tag, push the code onto the list and add a state token
		}
	},

	clearState: function(list, state) {
		this.clearEmptyColor(list, state);
		while (state.length) {
			var token = state.pop();
			list.push(this.token_const['CLOSE_' + token]);
		}
	},

	endColorParse: function(chr, list, state) {
		state.push('COLOR');
		list.push(chr);
	},

	closeColor: function(list, state) {
		for (var i = state.length - 1; i >= 0; i--) {
			if (state[i] === 'COLOR') {
				state.splice(i, 1);
				list.push(this.token_const.CLOSE_COLOR);
			}
		}
	},

	clearEmptyColor: function(list, state) {
		if (list.length && this.isEmptyColor(list[list.length - 1])) {
			list.pop();
			this.closeColor(list, state);
			// empty color object, remove it and update state and token list
		}
	},

	isEmptyColor: function(obj) {
		return (typeof obj == 'object' && !obj.fg && !obj.bg);
	},

	escapeHtml: function(text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	},

	renderTokenHtml: function(token) {
		if (typeof token == 'string') {
			return this.escapeHtml(token);
		} else if (typeof token == 'number') {
			return this.token_tags[token];
		} else if (typeof token == 'object') {
			return this.renderColorHtml(token);
		} else {
			return '';
		}
		// format strings, numbers and objects. As the token could be either
	},

	renderColorHtml: function(colorToken) {
		var classNames = [],
			styles = [];

		if (colorToken.fg) {
			if (colorToken.rgb) {
				styles.push('color:#' + colorToken.fg);
			} else if (this.color_map[colorToken.fg]) {
				classNames.push(this.color_map[colorToken.fg]);
			}
		}

		if (colorToken.bg) {
			if (colorToken.rgb) {
				styles.push('background-color:#' + colorToken.bg);
			} else if (this.color_map[colorToken.bg]) {
				classNames.push('bg-' + this.color_map[colorToken.bg]);
			}
		}

		var classAttr = '',
			styleAttr = '';

		if (classNames.length) {
			classAttr = ' class="' + classNames.join(' ') + '"';
		}

		if (styles.length) {
			styleAttr = ' style="' + styles.join(';') + '"';
		}

		return '<wbr><span' + classAttr + styleAttr + '>';
	},

	cleanup: function(tokens) {
		for (var i = tokens.length - 1; i >= 0; i--) {
			var token = tokens[i];

			if (typeof token == 'number') {
				continue;
			}

			if (typeof token == 'string') {
				break;
			}

			if (typeof token == 'object') {
				delete tokens[i];
			}
		}
		// check if any opening objects are on the end

		return tokens;
	},

	parseLinks: function(text, network) {
		var userList = App.__container__.cache.dict['controller:network'].get('socket').find('channelUsers', {network: network.name, channel: network.selectedTab.target}),
			regex = /(\()((?:ht|f)tps?:\/\/(?:\S|[\-._~!$&'()*+,;=:\/?#[\]@%])+)(\))|(\[)((?:ht|f)tps?:\/\/(?:\S|[\-._~!$&'()*+,;=:\/?#[\]@%])+)(\])|(\{)((?:ht|f)tps?:\/\/(?:\S|[\-._~!$&'()*+,;=:\/?#[\]@%])+)(\})|(<|&(?:lt|#60|#x3c);)((?:ht|f)tps?:\/\/(?:\S|[\-._~!$&'()*+,;=:\/?#[\]@%])+)(>|&(?:gt|#62|#x3e);)|((?:^|[^=\s'"\]])\s*['"]?|[^=\s]\s+)(\b(?:ht|f)tps?:\/\/(?:\S|[\-._~!$'()*+,;=:\/?#[\]@%])+(?:(?!&(?:gt|#0*62|#x0*3e);|&(?:amp|apos|quot|#0*3[49]|#x0*2[27]);[.!&',:?;]?(?:[^a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%\u0000-\uFFFF]|$))&[a-z0-9\-._~!$'()*+,;=:\/?#[\]@%\u0000-\uFFFF]*)*[a-z0-9\-_~$()*+=\/#[\]@%\u0000-\uFFFF])/img;

		text = text.replace(regex, '$1$4$7$10$13<a href="$2$5$8$11$14" target="_blank">$2$5$8$11$14</a>$3$6$9$12');
		// parse http links and www. urls (http://jmrware.com/articles/2010/linkifyurl/linkify.html)

		var split = text.split(' ');

		split.forEach(function(word, index) {
			var record = userList.findBy('nickname', word);
			if (record) {
				var route = '#/t/' + network.url + '/' + record.nickname;
				split[index] = '<a href="' + route + '" rel="nick-link" data-nick="' + record.nickname + '">' + record.nickname + '</a>';
			}
		});

		text = split.join(' ');
		text = text.replace(/(^|[ ]+)(#\S+)/ig, function(input, match, match2) {
			var route = '#/t/' + network.url + '/' + Helpers.encodeChannel(match2);
			return (match == ' ') ? ' <a href="' + route + '" rel="channel-link">' + match2 + '</a>' : '<a href="' + route + '" rel="channel-link">' + match2 + '</a>';
		});
		// parse channel into link

		return text;
	},

	exec: function(text, network) {
		if (text === '') {
			return text;
		} else if (text === undefined) {
			return '';
		}

		var tokens = this.tokenize(text),
			output = '';

		tokens = this.cleanup(tokens);
		// cleanup

		for (var i = 0; i < tokens.length; i++) {
			output += this.renderTokenHtml(tokens[i]);
		}
		// output has been rendered and formatted

		output = this.parseLinks(output, network);
		// one thing that hasn't been formatted at all are urls
		// we do that here

		return output;
	}
});