module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		less: {
			development: {
				options: {
					paths: ['client/less']
				},
				files: {
					'client/build/ircanywhere.css': 'client/less/**/*.less'
				}
			},
			production: {
				options: {
					paths: ['client/less'],
					cleancss: true
				},
				files: {
					'client/build/ircanywhere.css': 'client/less/**/*.less'
				}
			}
		},
		ember_handlebars: {
			compile: {
				options: {
					namespace: 'Ember.TEMPLATES'
				},
				files: {
					'client/build/templates.js': 'client/templates/**/*.hbs'
				}
			}
		},
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['client/js/**/*.js'],
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
		},
		watch: {
			ember_handlebars: {
				files: 'client/templates/**/*.hbs',
				tasks: ['ember_handlebars']
			},
			scripts: {
				files: 'client/js/**/*.js',
				tasks: ['default'],
				options: {
					event: ['all'],
				},
			},
		},
	});
	// Project configuration.

	grunt.loadNpmTasks('grunt-ember-handlebars');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task(s).
	grunt.registerTask('default', ['less', 'ember_handlebars', 'concat', 'uglify', 'watch']);
};