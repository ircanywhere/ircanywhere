App.Visibility = Ember.Mixin.create({
	bindVisibility: function() {
		var visProp = this.getHiddenProp();
		if (visProp) {
			var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
			Ember.$(document).on(evtname, this.visChange.bind(this));
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
			App.set('isActive', true);
		} else {
			App.set('isActive', false);
		}
	},

	getHiddenProp: function() {
		var prefixes = ['webkit','moz','ms','o'];

		// if 'hidden' is natively supported just return it
		if ('hidden' in document) return 'hidden';

		// otherwise loop over all the known prefixes until we find one
		for (var i = 0; i < prefixes.length; i++) {
			if ((prefixes[i] + 'Hidden') in document) {
				return prefixes[i] + 'Hidden';
			}
		}

		// otherwise it's not supported
		return null;
	}
});