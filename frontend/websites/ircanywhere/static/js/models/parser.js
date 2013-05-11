Parser = Backbone.Model.extend({
	
	prependedFTS: 0,
	prependedLTS: 0,
	prependedTabId: '',
	prependedMessages: '',

	message: function(data)
	{
		var message = new BufferMessageView(this, data);
		
		message = null;
	},

	notice: function(data)
	{
		var message = new BufferNoticeView(data);
		
		message = null;
    },

	other: function(tabId, chan, msg, type, data)
	{
		var prepend = data.prepend || false,
			last = data.last || false,
			noDate = data.noDate || false,
			message = new BufferOtherView({tabId: tabId, chan: chan, msg: msg, type: type, time: data.time, _id: data._id, prepend: prepend, last: last, noDate: noDate});
		
		message = null;
	},

	windowNotice: function(tabId, msg, prepend, date)
	{
		var date = date || null,
			message = new BufferWindowNoticeView({tabId: tabId, msg: msg, prepend: prepend, time: date});
		
		message = null;
	}
});

var parser = new Parser();