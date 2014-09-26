App.Visibility = Ember.Mixin.create({
	bindVisibility: function() {
		var self = this,
			visProp = this.getHiddenProp();
		
		if (visProp) {
			var evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
			self.visChange();

			Ember.$(document).on(evtname, function() {
				self.visChange(self.isHidden());
			});
		}
	},

	isHidden: function() {
		var prop = this.getHiddenProp();

		if (!prop) {
			return false;
		}

		return document[prop];
	},

	visChange: function(hidden) {
		this.set('isActive', !hidden);
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