module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		less: {
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
		emberTemplates: {
			compile: {
				options: {
					amd: false,
					templateBasePath: /client\/templates\//
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
			dependency: {
				src: ['client/ext/jquery*.js', 'client/ext/handlebars*.js', 'client/ext/ember*.js', 'client/ext/socket.io*.js'],
				dest: 'client/build/dependency.js'
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
			dependency: {
				src: 'client/build/dependency.js',
				dest: 'client/build/dependency.min.js'
			},
			dist: {
				src: 'client/build/<%= pkg.name %>.js',
				dest: 'client/build/<%= pkg.name %>.min.js'
			}
		},
		watch: {
			emberTemplates: {
				files: 'client/templates/**/*.hbs',
				tasks: ['emberTemplates'],
				options: {
					event: ['all'],
				}
			},
			scripts: {
				files: 'client/js/**/*.js',
				tasks: ['concat:dist', 'uglify:dist'],
				options: {
					event: ['all'],
				}
			},
			less: {
				files: 'client/less/**/*.less',
           		tasks: ['less'],
           		options: {
					event: ['all'],
				}
			}
		},
	});
	// Project configuration.

	grunt.loadNpmTasks('grunt-ember-templates');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task(s).
	grunt.registerTask('default', ['less', 'emberTemplates', 'concat', 'uglify', 'watch']);
};