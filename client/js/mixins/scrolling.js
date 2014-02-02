App.Scrolling = Ember.Mixin.create({
	bindScrolling: function(opts) {
		var self = this;
			opts = opts || {element: $(window), debounce: 100};
			this.opts = opts;

		if (this.opts.debounce) {
			var onScroll = function() {
				Ember.run.debounce(null, function() {
					return self.scrolled();
				}, self.opts.debounce);
			};
		} else {
			var onScroll = function(){ 
				return self.scrolled(); 
			};
		}

		this.opts.element.bind('scroll', onScroll);
	},

	unbindScrolling: function() {
		this.opts.element.unbind('scroll');
	}
});