App.SortingTableHeader = Ember.View.extend({
	tagName: 'th',
	template: Ember.Handlebars.compile('{{view.text}}'),
	classNameBindings: ['icon'],
	sortableArrayBinding: 'controller',

	icon: function () {
		var sortableArray = this.get('sortableArray');
		
		if (!Ember.isEmpty(sortableArray)) {
			var sortProps = sortableArray.get('sortProperties');
			if (Ember.isArray(sortProps) && sortProps.contains(this.get('property'))) {
				if (sortableArray.get('sortAscending')) {
					return 'icon-sort-up';
				} else {
					return 'icon-sort-down';
				}
			}
		}

		return 'icon-sort';
	}.property('sortableArray.sortProperties', 'sortableArray.sortAscending'),

	click: function () {
		var sortableArray = this.get('sortableArray'),
			sortProps = sortableArray.get('sortProperties');
		
		if (Ember.isArray(sortProps) && sortProps.contains(this.get('property'))) {
			sortableArray.toggleProperty('sortAscending');
		}

		sortableArray.set('sortProperties', [this.get('property')]);
	}
});