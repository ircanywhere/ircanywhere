App.EventController = Ember.ObjectController.extend({
	needs: ['tab', 'network'],
	
	classNames: function() {
		var type = this.get('content.type'),
			hideEvents = this.get('controllers.tab.model.hiddenEvents'),
			hide = (hideEvents && (type === 'join' || type === 'part' || type === 'quit')) ? ' hide' : '';

		return (type === 'privmsg') ? 'row' + hide : 'row other' + hide;
	}.property('content.type', 'controllers.tab.model.hiddenEvents').cacheable(),

	isJoin: function() {
		return (this.get('content.type') === 'join');
	}.property('content.type').cacheable(),

	isPart: function() {
		return (this.get('content.type') === 'part');
	}.property('content.type').cacheable(),

	isQuit: function() {
		return (this.get('content.type') === 'quit');
	}.property('content.type').cacheable(),

	isMode: function() {
		return (this.get('content.type') === 'mode');
	}.property('content.type').cacheable(),

	isTopic: function() {
		return (this.get('content.type') === 'topic');
	}.property('content.type').cacheable(),

	isNick: function() {
		return (this.get('content.type') === 'nick');
	}.property('content.type').cacheable(),

	isKick: function() {
		return (this.get('content.type') === 'kick');
	}.property('content.type').cacheable(),

	isPrivmsg: function() {
		return (this.get('content.type') === 'privmsg');
	}.property('content.type').cacheable(),

	actions: {
		visitLink: function() {
			alert('visiting ... ' + this.get('content.type'));
		}
	}
});