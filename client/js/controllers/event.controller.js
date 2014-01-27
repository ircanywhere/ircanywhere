App.EventController = Ember.ObjectController.extend({
	needs: ['tab', 'network'],
	
	classNames: function() {
		var type = this.get('content.type'),
			hideEvents = this.get('controllers.tab.model.hiddenEvents'),
			hide = (hideEvents && (type === 'join' || type === 'part' || type === 'quit')) ? ' hide' : '';

		return (type === 'privmsg' || type === 'action') ? 'row' + hide : 'row other' + hide;
	}.property('content.type', 'controllers.tab.model.hiddenEvents').cacheable(),

	templateName: function() {
		return 'events/' + this.get('content.type');
	}.property('content.type').cacheable(),

	actions: {
		goto: function(url) {
			url = url.substring(3);
			// cut the /t/ off the front

			var split = url.split('/');

			if (split.length === 1) {
				this.transitionToRoute('network', split[0]);
			} else {
				this.transitionToRoute('tab', split[0], split[1]);
			}
		}
	}
});