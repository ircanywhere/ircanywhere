var gulp = require('gulp'),
	less = require('gulp-less'),
	concatCss = require('gulp-concat-css'),
	handlebars = require('gulp-ember-handlebars'),
	uglify = require('gulp-uglifyjs'),
	watch = require('gulp-watch');

gulp.task('css', function() {
	gulp.src('./client/less/**/*.less')
		.pipe(less({
			paths: ['./client/less']
		}))
		.pipe(gulp.dest('./client/build/css'))
		.pipe(concatCss('ircanywhere.css'))
		.pipe(gulp.dest('./client/build'));
});

gulp.task('templates', function() {
	gulp.src(['./client/templates/**/*.hbs'])
		.pipe(handlebars({
			outputType: 'browser'
		}))
		.pipe(gulp.dest('./client/build/templates'))
		.pipe(uglify('templates.js', {
			outSourceMap: true,
			basePath: '/client/build/',
			mangle: false
		}))
		.pipe(gulp.dest('./client/build'))
});

gulp.task('js', function() {
	gulp.src(['./lib/*.js', './client/js/lib/*.js', './client/js/*.js', './client/js/helpers/*.js', './client/js/mixins/*.js', './client/js/routes/*.js', './client/js/models/*.js', './client/js/controllers/*.js', './client/js/components/*.js', './client/js/views/*.js'])
		.pipe(gulp.dest('./client/build/js'))
		.pipe(uglify('ircanywhere.js', {
			outSourceMap: true,
			basePath: '/client/build/',
			mangle: false
		}))
		.pipe(gulp.dest('./client/build'))
});

gulp.task('dependencies', function() {
	gulp.src(['client/ext/jquery*.js', 'client/ext/handlebars*.js', 'client/ext/ember*.js', 'client/ext/sockjs*.js'])
		.pipe(gulp.dest('./client/build/ext'))
		.pipe(uglify('dependencies.js', {
			outSourceMap: true,
			basePath: '/client/build/',
			mangle: true
		}))
		.pipe(gulp.dest('./client/build'))
});

gulp.task('css:watch', function() {
	watch({
		glob: './client/less/**/*.less',
		emit: 'one',
		emitOnGlob: false
	}, function(files) {
		gulp.start('css');
	});
});

gulp.task('templates:watch', function() {
	watch({
		glob: './client/templates/**/*.hbs',
		emit: 'one',
		emitOnGlob: false
	}, function() {
		gulp.start('templates');
	});
});

gulp.task('js:watch', function() {
	watch({
		glob: ['lib/*.js', 'client/js/**/*.js'],
		emit: 'one',
		emitOnGlob: false
	}, function() {
		gulp.start('js');
	});
});

gulp.task('default', ['css', 'templates', 'js', 'dependencies']);
gulp.task('watch', ['css:watch', 'templates:watch', 'js:watch']);