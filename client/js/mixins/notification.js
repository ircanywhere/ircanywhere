App.Notification = Ember.Mixin.create({
	notification: null,
	audioNotification: null,

	init: function() {
		this.set('audioNotification', Ember.$('audio#audio-notification').get(0));
		this.set('notification', window.Notification);
	},

	notify: function(title, o) {
		if (!title || !o.body) {
			throw new Error('Options object needs at least a body');
		}

		if (!this.isSupported()) {
			return false;
		}

		var options = {
				icon: '',
				body: '',
				tag: '',
				id: '',
				onShow: null,
				onClose: null,
				onClick: null,
				onError: null,
				timeout: null
			};

		options = Ember.merge(options, o);
		// extend options with o

		var Notify = new window.Notification(title, {
			body: options.body,
			tag: options.tag,
			icon: options.icon
		});

		Notify.id = options.id;
		Notify.options = options;
		Notify.singleton = this;

		if (options.timeout && !isNaN(options.timeout)) {
			Ember.run.later(function() {
				Notify.close();
			}, (options.timeout * 1000));
		}

		Notify.addEventListener('show', this.onShow.bind(Notify), false);
		Notify.addEventListener('error', this.onError.bind(Notify), false);
		Notify.addEventListener('close', this.onClose.bind(Notify), false);
		Notify.addEventListener('click', this.onClick.bind(Notify), false);
		// add event listeners if they exist so we can handle things like clicks..

		if (typeof this.audioNotification.play === 'function') {
			this.audioNotification.play();
		}
		// play a sound!

		return Notify;
	},

	destroy: function() {
		this.removeEventListener('show', this.singleton.onShow.bind(this), false);
		this.removeEventListener('error', this.singleton.onError.bind(this), false);
		this.removeEventListener('close', this.singleton.onClose.bind(this), false);
		this.removeEventListener('click', this.singleton.onClick.bind(this), false);
		// clean up
	},

	isSupported: function () {
		if ('Notification' in window) {
			return true;
		}

		return false;
	},

	onShow: function() {
		if (this.options.onShow) {
			this.options.onShow(this);
		}
	},

	onError: function() {
		if (this.options.onError) {
			this.options.onError(this);
		}
	},

	onClose: function() {
		if (this.options.onClose) {
			this.options.onClose(this);
		}

		this.singleton.destroy.call(this);
	},

	onClick: function() {
		if (this.options.onClick) {
			this.options.onClick(this);
		}
	},

	needsPermission: function () {
		if (this.isSupported() && this.notification.permission === 'granted') {
			return false;
		}

		return true;
	},

	requestPermission: function(granted, denied) {
		if (!this.isSupported()) {
			return false;
		}

		this.notification.requestPermission(function(perm) {
			if (perm === 'granted' && typeof granted === 'function') {
				granted();
			}

			if (perm === 'denied' && typeof denied === 'function') {
				denied();
			}
		});
	}
});