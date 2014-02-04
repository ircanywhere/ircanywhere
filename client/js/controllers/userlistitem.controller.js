App.UserlistitemController = Ember.ObjectController.extend({
	needs: ['network', 'userlist'],
	showHeading: false,

	type: function() {
		var sort = this.get('content.sort');
		switch (sort) {
			case 3:
				return 'op';
				break;
			case 2:
				return 'halfop';
				break;
			case 1:
				return 'voice';
				break;
			default:
				return 'user';
				break;
		}
	}.property('content.sort').cacheable(),

	heading: function() {
		var type = this.get('type');
		switch (type) {
			case 'op':
				return 'Operators';
				break;
			case 'halfop':
				return 'Half Operators';
				break;
			case 'voice':
				return 'Voiced';
				break;
			case 'user':
				return 'Users';
				break;
		}
	}.property('type').cacheable(),

	count: function() {
		return this.get('controllers.userlist.filtered').filterProperty('sort', this.get('content.sort')).length;
	}.property('content.sort', 'controllers.userlist.filtered').cacheable(),

	init: function() {
		var last = this.get('controllers.userlist.last') || false;

		if (!last || (last.sort !== this.get('content.sort'))) {
			this.set('showHeading', true);
		}

		this.set('controllers.userlist.last', this.get('content'));
	}
});