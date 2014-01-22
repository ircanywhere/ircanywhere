App.EventController = Ember.ObjectController.extend({
	needs: ['tab', 'network'],
	
	classNames: function() {
		var type = this.get('content.type'),
			hideEvents = this.get('controllers.tab.model.hiddenEvents'),
			hide = (hideEvents && (type === 'join' || type === 'part' || type === 'quit')) ? ' hide' : '';

		return (type === 'privmsg') ? 'row' + hide : 'row other' + hide;
	}.property('content.type', 'controllers.tab.model.hiddenEvents'),

	isJoin: function() {
		return (this.get('content.type') === 'join');
	}.property('content.type'),

	isPart: function() {
		return (this.get('content.type') === 'part');
	}.property('content.type'),

	isQuit: function() {
		return (this.get('content.type') === 'quit');
	}.property('content.type'),

	isMode: function() {
		return (this.get('content.type') === 'mode');
	}.property('content.type'),

	isTopic: function() {
		return (this.get('content.type') === 'topic');
	}.property('content.type'),

	isNick: function() {
		return (this.get('content.type') === 'nick');
	}.property('content.type'),

	isKick: function() {
		return (this.get('content.type') === 'kick');
	}.property('content.type'),

	isPrivmsg: function() {
		return (this.get('content.type') === 'privmsg');
	}.property('content.type'),

	actions: {
		visitLink: function() {
			alert('visiting ... ' + this.get('content.type'));
		}
	}
});