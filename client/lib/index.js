function App() {
	this.title = 'IRCAnywhere';
};

// -------------------------------------
// All the core workings of the application is here, each part is split up into
// folders, see signup/signup.html(.less/.js) for the corresponding css/js. Much easier
// managing it this way, plus Meteor doesn't promote a proper MVC architecture like Backbone does
// it's all based upon templates, although we can extend the template objects for more functionality

App.prototype.reRoute = function() {
	var networks = Tabs.find({}, {reactive: false}).fetch(),
		selected = false,
		first = '';

	for (var i in networks) {
		var network = networks[i];
		
		for (var x in network.tabArray) {
			var tab = network.tabArray[x];

			if (tab.selected) {
				selected = tab.url;
				break;
			}

			if (x == 0) {
				first = tab.url;
			}
		}

		if (selected !== false) {
			break;
		}
	}
	// loop networks and then tabs to determine which one is selected
	// it's a bit messy but this is the way the data structure is.. Maybe
	// will be changed in the future..

	if (selected !== false) {
		Router.go('/' + selected);
	} else if (first !== '') {
		Router.go('/' + first);
	}
	// reroute the url if selected !== false, which means we've found a tab that needs to be selected
	// else none of them are selected, which is unusual but possible. This function will only get called
	// if the url needs to be rerouted, so we can assume that we need to select any tab, the first one will do.
};

App.prototype.mouseEnter = function(e, t) {
	var target = e.currentTarget.className;
	if (target !== 'topic-wrap' && target !== 'overlay-bar') {
		return false;
	}

	Application.timein = Meteor.setTimeout(function() {
		$('#tab-' + t.data._id + ' .overlay-bar').slideDown('fast');
	}, 500);
	// create a timer to slide the overlay bar down

	Meteor.clearTimeout(Application.timeout);
};

App.prototype.mouseLeave = function(e, t) {
	var target = e.currentTarget.className;
	if (target !== 'topic-wrap' && target !== 'overlay-bar') {
		return false;
	}
	
	Application.timeout = Meteor.setTimeout(function() {
		$('#tab-' + t.data._id + ' .overlay-bar').slideUp('fast');
	}, 500);
	// create a timer to slide the overlay bar up

	Meteor.clearTimeout(Application.timein);
};
// -------------------------------------

Application = new App();