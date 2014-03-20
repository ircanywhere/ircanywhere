App.Visibility = Ember.Mixin.create({
	bindVisibility: function() {
		var visProp = this.getHiddenProp();
		
		if (visProp) {
			var evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
			Ember.$(document).on(evtname, this.visChange.bind(this));
			this.visChange();
		}
	},

	isHidden: function() {
		var prop = this.getHiddenProp();

		if (!prop) {
			return false;
		}

		return document[prop];
	},

	visChange: function() {
		if (this.isHidden()) {
			App.set('isActive', false);
		} else {
			App.set('isActive', true);
		}
	},

	getHiddenProp: function() {
		var prefixes = ['webkit', 'moz', 'ms', 'o'];

		if ('hidden' in document) {
			return 'hidden';
		}
		// if 'hidden' is natively supported just return it

		for (var i = 0; i < prefixes.length; i++) {
			if ((prefixes[i] + 'Hidden') in document) {
				return prefixes[i] + 'Hidden';
			}
		}
		// otherwise loop over all the known prefixes until we find one

		return null;
		// otherwise it's not supported
	}
});