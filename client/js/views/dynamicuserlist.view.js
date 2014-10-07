App.DynamicuserlistView = Ember.View.extend({
	type: 'normal',
	classType: 'user',

	addEvent: null,
	removeEvent: null,

	init: function() {
		this.set('addEvent', 'addUser:' + this.get('type'));
		this.set('removeEvent', 'removeUser:' + this.get('type'));

		this.get('controller')
			.on(this.addEvent, this, this.addUser)
			.on(this.removeEvent, this, this.removeUser);
	},

	willDestroy: function() {
		this.get('controller')
			.off(this.addEvent, this, this.addUser)
			.off(this.removeEvent, this, this.removeUser);
	},

	addUser: function(user) {
		var self = this,
			prevItem,
			toInsert = true;

		this.list.forEach(function(item, index) {
			if (Ember.compare(user.nickname.toLowerCase(), item.nickname.toLowerCase()) === -1 && toInsert) {
				var el = $('li[data-type=' + self.get('classType') + '][data-user-id=' + item._id + ']');

				if (!el.length) {
					el = $('li[data-type=' + self.get('classType') + '][data-user-id=' + prevItem._id + ']');
					el.after(self.generateUserLink(user));
				} else {
					el.before(self.generateUserLink(user));
				}

				toInsert = false;
				return false;
			}

			prevItem = item;
		});

		if (toInsert) {
			var el = $('li[data-type=' + this.get('classType') + ']:last-child');

			if (el.length) {
				el.after(this.generateUserLink(user));
			} else {
				this.$().html(this.generateUserLink(user));
			}
		}
	},

	removeUser: function(user) {
		var element = $('li[data-user-id=' + user._id + ']');

		if (element && element.length) {
			element.remove();
		}
	},

	generateUserLink: function(user) {
		return '<li data-type="' + this.get('classType') + '" data-user-id="' + user._id + '">' + Ember.Handlebars.helpers.userLink._rawFunction.apply(this.get('controller'), [true, user]) + '</li>';
	},

	render: function(buffer) {
		var self = this;

		this.list.forEach(function(user) {
			buffer.push(self.generateUserLink(user));
		});
	}
});
