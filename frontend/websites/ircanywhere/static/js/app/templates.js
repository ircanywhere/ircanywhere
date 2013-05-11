var Templates = {
	
	/*
	 * Templates::preDefine
	 *
	 * Pre defines all the templates so $.tmpl() takes a string, keeps us from re-requesting
	 * template every time, tiny tiny bit of overhead saved, but every save is better, plus
	 * it's a bit neater. If this isn't called none of our $.tmpl() calls will work
	 */
	preDefine: function()
	{
		$.template('messageRowAction', this.messageRow(true));
		$.template('messageRow', this.messageRow(false));
		$.template('noticeRow', this.noticeRow());
		$.template('otherRow', this.otherRow());
		$.template('collapsedHeadingRow', this.collapsedHeadingRow());
		$.template('windowNoticeRow', this.windowNoticeRow());
		$.template('dividerRow', this.dividerRow());
		$.template('tabLinkNetworkLocked', this.tabLinkNetwork(true));
		$.template('tabLinkNetworkUnlocked', this.tabLinkNetwork(false));
		$.template('tabLink', this.tabLink());
		$.template('tabHtmlWindow', this.tabHtmlWindow());
		$.template('tabHtmlChannel', this.tabHtmlChannel());
		$.template('tabHtmlOther', this.tabHtmlOther());
	},

	/*
	 * Templates::messageRow
	 *
	 * Return a predefined html template for message rows.
	 *
	 * Parameters: action (boolean) (whether the message is an action or not ie /me)
	 */
	messageRow: function(action)
	{
		if (action)
		{
			return '<div class="clear row${cssClass}" data-type="privmsg" data-id="${id}" data-self="${self}" data-read="${read}" data-highlight="${highlight}" data-time="${date}">' +
				'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
				'<span class="column2 action">' +
					'{{html userLink}}' +
					'{{html parsedMessage}}' +
				'</span>' +
			'</div>';
			// the template for /me is slightly different
		}
		else
		{
			return '<div class="clear row${cssClass}" data-type="privmsg" data-id="${id}" data-self="${self}" data-read="${read}" data-highlight="${highlight}" data-time="${date}">' +
				'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
				'<span class="column2 message">' +
					'{{html userLink}}' +
					'{{html parsedMessage}}' +
				'</span>' +
			'</div>';
			// normal message row
		}
	},

	/*
	 * Templates::noticeRow
	 *
	 * Return a predefined html template for notice rows
	 */
	noticeRow: function()
	{
		return '<div class="row clear" data-type="notice" data-read="${read}" data-id="${id}" data-time="${date}">' +
			'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
			'<span class="column2 message">' + 
				'{{html userLink}}' +
				'{{html parsedMessage}}' +
			'</span>' +
		'</div>';
	},

	/*
	 * Templates::otherRow
	 *
	 * Return a predefined html template for other rows (join/part etc)
	 */
	otherRow: function()
	{
		return '<div class="row clear${cssClass}" data-type="${type}" data-id="${id}" data-time="${date}">' +
			'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
			'<span class="column2 ${messageCssClass}">' + 
				'{{html message}}' +
			'</span>' +
		'</div>';
	},

	/*
	 * Templates::collapsedHeadingRow
	 *
	 * Return a predefined html template for collapsable heading rows
	 */
	collapsedHeadingRow: function()
	{
		return '<div class="row otherRow clear collapsed-head" data-type="collapse" data-time="${date}">' +
			'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
			'<span class="column2 event">' + 
				'{{html message}}' +
			'</span>' +
		'</div>' +
		'<div class="collapsed row otherRow hide" data-type="collapse" data-time="${date}"></div>';
	},

	/*
	 * Templates::windowNoticeRow
	 *
	 * Return a window notice row
	 */
	windowNoticeRow: function()
	{
		return '<div class="row clear" data-type="window-notice" data-id="${id}" data-time="${date}">' +
			'<div class="divider">' +
				'{{html message}}' +
			'</div>' +
		'</div>';
	},

	/*
	 * Templates::dividerRow
	 *
	 * Return a divider row
	 */
	dividerRow: function()
	{
		return '<div class="row clear" data-type="${type}">' +
			'<fieldset>' +
				'<legend align="center">' +
					'{{html message}}' +
				'</legend>' +
			'</fieldset>' +
		'</div>';
	},

	/*
	 * Templates::tabLinkNetwork
	 *
	 * Return a tab link for a network window
	 *
	 * Parameters: locked (boolean) (whether the network is locked or not)
	 */
	tabLinkNetwork: function(locked)
	{
		if (locked)
		{
			return '<li class="title clear" id="link-${id}" data-type="window">' +
				'<a href="${hash}" title="${title}" class="locked">' +
					'<span class="link net-loader">${chan}</span>' +
				'</a>' +
				//'{{html closeLink}}' +
			'</li>';
		}
		else
		{
			return '<li class="title clear" id="link-${id}" data-type="window">' +
				'<a href="${hash}" title="${title}">' +
					'<span class="link net-loader">${chan}</span>' +
				'</a>' +
				//'{{html closeLink}}' +
			'</li>';
		}
	},

	/*
	 * Templates::tabLink
	 *
	 * Return a tab link
	 */
	tabLink: function()
	{
		return '<li class="clear" id="link-${id}" data-type="${type}">' +
			'<a href="${hash}" title="${title}">' +
				'<span class="link ${cssClass}">${chan}</span>' +
			'</a>' +
			//'<a href="#" class="close">&times;</a>' +
		'</li>';
	},

	/*
	 * Templates::tabHtmlWindow
	 *
	 * Return the full html for a window/privmsg tab
	 */
	tabHtmlWindow: function()
	{
		return '<div id="tab-${id}" class="tab clear">' +
			'<div id="msgs-${id}" class="wmsg_container">' +
				'<div class="mcontainer content">' +
					'<div class="overlay-bar"></div>' +
					'<div class="top-message-bar message-bar clear">' +
						'<span class="left">' +
							'<span class="last hide">0</span>' +
							'<span class="message-number"></span>' +
						'</span>' +
						'<span class="right">' +
							'<a href="#" id="read-backlog">Mark as read</a>' +
						'</span>' +
					'</div>' +
					'<div class="row clear hide" data-type="initial-divider"></div>' +
				'</div>' +
			'</div>' +
		'</div>';
	},

	/*
	 * Templates::tabHtmlChannel
	 *
	 * Return the full html for a channel tab
	 */
	tabHtmlChannel: function()
	{
		return '<div id="tab-${id}" class="tab clear">' +
			'<div id="msgs-${id}" class="msg_container">' +
				'<div class="mcontainer content">' +
					'<div class="overlay-bar"></div>' +
					'<div class="top-message-bar message-bar clear">' +
						'<span class="left">' +
							'<span class="last hide">0</span>' +
							'<span class="message-number"></span>' +
						'</span>' +
						'<span class="right">' +
							'<a href="#" id="read-backlog">Mark as read</a>' +
						'</span>' +
					'</div>' +
					'<div class="row clear hide" data-type="initial-divider"></div>' +
				'</div>' +
			'</div>' +
			'<div class="userlist" id="list-${id}">' +
				'<div class="content"></div>' +
			'</div>' +
		'</div>';
	},

	/*
	 * Templates::tabHtmlOther
	 *
	 * Return the full html for a 'other' tab (ie list/links)
	 */
	tabHtmlOther: function()
	{
		return '<div id="tab-${id}" class="tab clear">' +
			'<div id="msgs-${id}" class="wmsg_container t_container">' +
				'<div class="mcontainer content">' +
					'<div class="overlay-bar"></div>' +
					'<div class="top-message-bar message-bar clear">' +
						'<span class="left">' +
							'<span class="last hide">0</span>' +
							'<span class="message-number"></span>' +
						'</span>' +
						'<span class="right">' +
							'<a href="#" id="read-backlog">Mark as read</a>' +
						'</span>' +
					'</div>' +
					'<table id="table-${id}" class="tablesorter"></table>' +
				'</div>' +
			'</div>' +
		'</div>';
	}
};