App.Scrolling = Ember.Mixin.create({
	bindScrolling: function(opts) {
		var self = this,
			onScroll;

		opts = opts || {element: document, debounce: 100};
		this.opts = opts;

		if (this.opts.debounce) {
			onScroll = function() {
				Ember.run.debounce(null, function() {
					return self.scrolled();
				}, self.opts.debounce);
			};
		} else {
			onScroll = function(){
				return self.scrolled(); 
			};
		}

		this.opts.element.addEvent('scroll', onScroll);
	},

	unbindScrolling: function() {
		this.opts.element.removeEvent('scroll');
	}
});