var gulp         = require('gulp'),
    babel        = require('gulp-babel'),
    uglify       = require('gulp-uglifyjs'),
	browserSync  = require('browser-sync'),
    plumber      = require('gulp-plumber'),
    notify       = require('gulp-notify'),
    webpack      = require('webpack-stream');


const PUBLIC_PATH = './public';
const SRC_PATH = './src';

const PATH = {
    css: PUBLIC_PATH+'/assets/css' ,
    html: PUBLIC_PATH,
    js_public: PUBLIC_PATH+'/js',

    sass: SRC_PATH+'/assets/scss',
    jade: SRC_PATH,
    js_dev: SRC_PATH+'/js'
};





// auto reloading browser browser-sync
gulp.task('browser-sync', function() { 
	browserSync({ 
		port: 9000,
		server: { 
			baseDir: PUBLIC_PATH
		},
		notify: false 
	});
});

// min js files and libraries
gulp.task('scripts', function() {
	return gulp.src( PATH.js_dev+'/game-audio.js' )
        .pipe(plumber(plumber({
            errorHandler: notify.onError(function (err) {
                return {
                    title: "Scripts",
                    message: err.message
                };
            })
        })))

        .pipe(webpack(
            {
                //watch: true,
                output: {filename: 'game-audio.js'}
            }
        ))
        .pipe(babel({
            presets: ['env']
        }))

        .pipe(uglify())

		.pipe(gulp.dest( PATH.js_public ));
});



// Watching
gulp.task('watch', ['browser-sync'], function() {
	gulp.watch(PATH.js_dev+'/**/*.js', ['scripts']);
	gulp.watch([
        PATH.html+'/*.html',
        PATH.js_public+'/**/*.js',
        PATH.css+'/**/*.css'
    ]).on('change', browserSync.reload);
});




// default task
gulp.task('default', ['watch']);















