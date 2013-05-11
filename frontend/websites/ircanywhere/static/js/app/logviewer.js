$(document).ready(function()
{
	IRCParser.initialise();
	// initialise the irc parser

	function loadFunction()
	{
		var pathArray = window.location.pathname.split('/'),
			network = pathArray[2],
			target = pathArray[3];
		// get network and all that stuff

		$('div#logDiv div.log-row').each(function(div, el)
		{
			var ts = $(el).find('div.log-row-ts').text(),
				ts = ts.substr(1, ts.length - 2),
				newDate = new Date(parseInt(ts)),
				hours = (newDate.getHours() < 10) ? '0' + newDate.getHours() : newDate.getHours(),
				minutes = (newDate.getMinutes() < 10) ? '0' + newDate.getMinutes() : newDate.getMinutes(),
				seconds = (newDate.getSeconds() < 10) ? '0' + newDate.getSeconds() : newDate.getSeconds(),
				newTs = hours + ':' + minutes + ':' + seconds;
			// reparse the timestamps locally :/

			var split = $(el).find('div.log-row-text').text().split(' '),
				nick = split[0],
				split = split.slice(1, split.length),
				newText = nick.replace(/>/g, "&gt;").replace(/</g, "&lt;") + ' ' + IRCParser.exec(split.join(' '), {url: network});
			// parse the text row stuff

			$(el).empty().html('<div class="log-row-ts">[' + newTs + ']</div><div class="log-row-text">' + newText + '</div>');
		});
		// loop log rows and parse them

		$('button[data-type=date]').bind('click', function (e)
		{
			$.pjax({url: $(this).attr('data-location'), container: '#main-holder .content'});
			e.preventDefault();
		});
		// assign events to the dateLess, dateMore buttons

		$('select#viewLogs, select#viewLogNet').bind('change', function(e)
		{
			$.pjax({url: $(this).find('option:selected').attr('data-location'), container: '#main-holder .content'});
			e.preventDefault();
		});
		// assign an event to viewNetwork when it changes

		$('.channel-select').pjax('a', '#main-holder .content');
		// handle pjax links
	};

	loadFunction();
	
	$(document).on('pjax:send', function()
	{
		$('#main-holder .content').html('');
		$('#loading').removeClass('hide');
	});

	$(document).on('pjax:complete', function()
	{
		loadFunction();
		$('#loading').addClass('hide');
	});

	$(document).on('pjax:timeout', function(event)
	{
		event.preventDefault();
	});
	// handle loading icons
});