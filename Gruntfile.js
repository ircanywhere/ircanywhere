module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		ember_handlebars: {
			compile: {
				options: {
					namespace: 'App.TEMPLATES'
				},
				files: {
					'client/build/templates.js': 'client/templates/*.hbs'
				}
			}
		},
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['client/js/*'],
				dest: 'client/build/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'client/build/<%= pkg.name %>.js',
				dest: 'client/build/<%= pkg.name %>.min.js'
			}
		}
	});
	// Project configuration.

	grunt.loadNpmTasks('grunt-ember-handlebars');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task(s).
	grunt.registerTask('default', ['ember_handlebars', 'concat', 'uglify']);
};