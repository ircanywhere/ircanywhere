Application = (function() {
	"use strict";

	var Module = {
		generateTabs: function() {
			console.log(Channels.find({}).fetch());
		}
	};

	return Module;
}());