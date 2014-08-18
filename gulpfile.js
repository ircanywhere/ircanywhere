var gulp = require('gulp'),
	less = require('gulp-less'),
	concatCss = require('gulp-concat-css'),
	handlebars = require('gulp-ember-handlebars'),
	uglify = require('gulp-uglifyjs'),
	clean = require('gulp-clean'),
	jshint = require('gulp-jshint'),
	mocha = require('gulp-mocha'),
	concat = require('gulp-concat'),
	sourcemaps = require('gulp-sourcemaps');

gulp.task('clean', function() {
	gulp.src('./client/build', {read: false})
		.pipe(clean({force: true}));
});

gulp.task('css', function() {
	gulp.src([
			'client/ext/*.css',
			'./client/less/**/!(mobile)*.less',  // make sure mobile.less is last
			'./client/less/mobile.less',
			'./modules/*/client/less/**/*.less'
		])
		.pipe(less({
			paths: ['./client/less']
		}))
		.pipe(concatCss('ircanywhere.css'))
		.pipe(gulp.dest('./client/build'));
});

gulp.task('templates', function() {
	gulp.src(['./client/templates/**/*.hbs', './modules/*/client/templates/**/*.hbs'])
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

gulp.task('templates:debug', function() {
	gulp.src(['./client/templates/**/*.hbs', './modules/*/client/templates/**/*.hbs'])
		.pipe(handlebars({
			outputType: 'browser'
		}))
		.pipe(sourcemaps.init())
		.pipe(concat('templates.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./client/build'))
});

gulp.task('js', function() {
	gulp.src(['./lib/*.js', './client/js/lib/*.js', './client/js/*.js', './client/js/helpers/*.js', './client/js/mixins/*.js', './client/js/routes/*.js', './client/js/models/*.js', './client/js/controllers/*.js', './client/js/components/*.js', './client/js/views/*.js', './modules/*/client/js/**/*.js'])
		.pipe(gulp.dest('./client/build/js'))
		.pipe(uglify('ircanywhere.js', {
			outSourceMap: true,
			basePath: '/client/build/',
			mangle: false
		}))
		.pipe(gulp.dest('./client/build'))
});

gulp.task('js:debug', function() {
	gulp.src(['./lib/*.js', './client/js/lib/*.js', './client/js/*.js', './client/js/helpers/*.js', './client/js/mixins/*.js', './client/js/routes/*.js', './client/js/models/*.js', './client/js/controllers/*.js', './client/js/components/*.js', './client/js/views/*.js', './modules/*/client/js/**/*.js'])
		.pipe(sourcemaps.init())
		.pipe(concat('ircanywhere.js'))
		.pipe(sourcemaps.write('.'))
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

gulp.task('dependencies:debug', function() {
	gulp.src(['client/ext/jquery*.js', 'client/ext/handlebars*.js', 'client/ext/ember*.js', 'client/ext/sockjs*.js'])
		.pipe(sourcemaps.init())
		.pipe(concat('dependencies.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('client/build'))
});

gulp.task('static', function() {
	gulp.src('./client/static/**')
		.pipe(gulp.dest('./client/build'));
});

gulp.task('client-jshint', function () {
	gulp.src(['./client/js/**/*.js'])
		.pipe(jshint('./client/.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('server-jshint', function () {
	gulp.src(['./server/*.js'])
		.pipe(jshint('./server/.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('jshint', ['server-jshint', 'client-jshint']);

gulp.task('mocha', function () {
	gulp.src('test/**/*.js', {read: false})
		.pipe(mocha({reporter: 'dot'}));
});

gulp.task('css:watch', function() {
	gulp.watch(['./client/less/**/*.less', './modules/*/client/less/**/*.less'], ['css']);
});

gulp.task('templates:watch', function() {
	gulp.watch(['./client/templates/**/*.hbs', './modules/*/client/templates/**/*.hbs'], ['templates']);
});

gulp.task('js:watch', function() {
	gulp.watch(['lib/*.js', 'client/js/**/*.js', './modules/*/client/js/**/*.js'], ['js']);
});

gulp.task('static:watch', function() {
	gulp.watch(['client/static/**'], ['static']);
});

gulp.task('default', ['css', 'templates', 'js', 'dependencies', 'static']);
gulp.task('watch', ['default', 'css:watch', 'templates:watch', 'js:watch', 'static:watch']);
gulp.task('test', ['jshint', 'mocha']);
gulp.task('debug', ['css', 'templates:debug', 'js:debug', 'dependencies:debug', 'static']);
