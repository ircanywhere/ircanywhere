App.DynamicuserlistView = Ember.View.extend({
	type: 'normal',
	classType: 'user',

	init: function() {
		var self = this;

		this.list.addArrayObserver(this, {
			willChange: function(list, offset, removeCount, addCount) {
				var item = list.objectAt(offset);
				if (removeCount > 0 && self.get('controller.rerender') === false) {
					self.removeUser(offset, item);
				}
			},
			didChange: function(list, offset, removeCount, addCount) {
				var item = list.objectAt(offset);
				
				if (addCount > 0 && self.get('controller.rerender') === false) {
					self.addUser(offset, item);
				}
			}
		});
	}.on('render'),

	addUser: function(offset, user) {
		var self = this,
			toInsert = true;

		this.list.forEach(function(item, index) {
			if (user.nickname.toLowerCase() < item.nickname.toLowerCase() && toInsert) {
				self.$('li[data-type="' + self.get('classType') + '"][data-user=' + item.nickname.toLowerCase() + ']').before(self.generateUserLink(user));
				toInsert = false;
			}
		});

		if (toInsert) {
			this.$('li[data-type="' + this.get('classType') + '"].head').after(this.generateUserLink(user));
		}
	},

	removeUser: function(offset, user) {
		var element = self.$('li[data-user=' + user.nickname.toLowerCase() + ']');

		if (element && element.length) {
			element.remove();
		}
	},

	generateUserLink: function(user) {
		return '<li data-type="' + this.get('classType') + '" data-user="' + user.nickname.toLowerCase() + '">' + Ember.Handlebars.helpers.userLink._rawFunction.apply(this.get('controller'), [true, user]) + '</li>';
	},

	render: function(buffer) {
		var self = this;

		this.set('controller.rerender', false);
		this.list.forEach(function(user) {
			buffer.push(self.generateUserLink(user));
		});
	}
});
