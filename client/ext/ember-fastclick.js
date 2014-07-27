/* 
 https://github.com/JamesHight/emberjs-touch

 Copyright (c) 2012 by:

 * James Hight 

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

Ember.fastclick = function(){
	var touch = {
		start: false, // has the touchstart event been triggered and is it still a valid click event?
		// starting coordinates of touch event
		x: null,
		y: null,
		enabled: true
	};


	// Temporarily disable touch to prevent duplicate clicks
	function disableTouch() {
		if (touch.enabled) {
			touch.enabled = false;
			setTimeout(function() {
				touch.enabled = true;
			}, 400);
		}
	}

	Ember.EventDispatcher.reopen({
		setupHandler: function(rootElement, event, eventName) {
			if (!touch.enabled) return;

			var self = this,
				moved;
			rootElement.delegate('.ember-view', event + '.ember', function(evt, triggeringManager) {
				// Track touch events to see how far the user's finger has moved
				// If it is > 20 it will not trigger a click event

				switch(evt.type) {
					// Remember our starting point
					case 'touchstart':
						this.setAttribute("data-original-class", this.className)
						this.className += ' pseudo-active';
						touch.start = true;
						touch.x = evt.originalEvent.touches[0].clientX;
						touch.y = evt.originalEvent.touches[0].clientY;
						evt.stopPropagation();
						break;

					// Monitor touchmove in case the user moves their finger away and then back to the original starting point
					case 'touchmove':
						if (touch.start) {
							moved = Math.max(Math.abs(evt.originalEvent.touches[0].clientX - touch.x),
								Math.abs(evt.originalEvent.touches[0].clientY - touch.y));
							if (moved > 20)
								touch.start = false;
						}
						break;
					case 'touchcancel':
						if (this.getAttribute('data-original-class'))
							this.className = this.getAttribute('data-original-class');
						break;
					// Check end point
					case 'touchend':
						if (touch.start) {
							if (this.getAttribute('data-original-class'))
								this.className = this.getAttribute('data-original-class');
							moved = Math.max(Math.abs(evt.originalEvent.changedTouches[0].clientX - touch.x),
								Math.abs(evt.originalEvent.changedTouches[0].clientY - touch.y));
							if (moved < 20) {
								evt.preventDefault();
								evt.stopImmediatePropagation();
								// All tests have passed, trigger click event		
								if (touch.enabled) {
									setTimeout(function(){
										$(evt.target).click();
									}, 50);
								}
							}
							touch.start = false;
						}
						break;
				}

				// END touch code

				var view = Ember.View.views[this.id],
					result = true, manager = null;

				manager = self._findNearestEventManager(view,eventName);

				if (manager && manager !== triggeringManager) {
					if (eventName == 'click') {
						if (touch.enabled)
							disableTouch();
						else
							return false;
					}
					result = self._dispatchEvent(manager, evt, eventName, view);
				} else if (view) {
					result = self._bubbleEvent(view,evt,eventName);
				} else {
					evt.stopPropagation();
				}

				return result;
			});

			rootElement.delegate('[data-ember-action]', event + '.ember', function(evt) {
				var actionId = Ember.$(evt.currentTarget).attr('data-ember-action'),
					action   = Ember.Handlebars.ActionHelper.registeredActions[actionId],
					handler;
				if (action) {
					handler = action.handler;

					if (action.eventName === eventName) {
						if (touch.enabled)
							disableTouch();
						else
							return false;

						return handler(evt);
					}
				}
			});
		}
	});
};

Ember.fastclick();
