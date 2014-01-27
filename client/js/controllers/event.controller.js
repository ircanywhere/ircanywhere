App.EventController = Ember.ObjectController.extend({
	needs: ['tab', 'network'],
	
	classNames: function() {
		var type = this.get('content.type'),
			hideEvents = this.get('controllers.tab.model.hiddenEvents'),
			hide = (hideEvents && (type === 'join' || type === 'part' || type === 'quit')) ? ' hide' : '';

		return (type === 'privmsg' || type === 'action') ? 'row' + hide : 'row other' + hide;
	}.property('content.type', 'controllers.tab.model.hiddenEvents').cacheable(),

	templateName: function() {
		switch (this.get('content.type')) {
			case 'join':
				return 'events/join';
				break;
			case 'part':
				return 'events/part';
				break;
			case 'quit':
				return 'events/quit';
				break;
			case 'mode':
				return 'events/mode';
				break;
			case 'topic':
				return 'events/topic';
				break;
			case 'nick':
				return 'events/nick';
				break;
			case 'kick':
				return 'events/kick';
				break;
			case 'privmsg':
				return 'events/privmsg';
				break;
			case 'action':
				return 'events/action';
				break;
			default:
				break;
		}
	}.property('content.type').cacheable(),

	actions: {
		visitLink: function() {
			alert('visiting ... ' + this.get('content.type'));
		}
	}
});