var gulp = require('gulp'),
    watch = require('gulp-watch'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    webserver = require('gulp-webserver');


var paths = {
    javascript: [
        'app/**/*.js',
        '!app/dist/**/*.js',
        '!app/bower_components/**/*.js'
    ],
    css: [
        'app/**/*.css',
        '!app/dist/**/*.css',
        '!app/bower_components/**/*.css'
    ]
};

gulp.task('compress', function() {
    return gulp.src(paths.javascript)
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('app/dist/'));
});

gulp.task('serve', function() {
    gulp.src('app')
        .pipe(webserver({
            livereload: true,
            directoryListing: false,
            open: false
        }));
});

gulp.task('watch', function() {
    gulp.watch(paths.javascript, ['compress']);
});

gulp.task('default', [ 'compress', 'serve', 'watch']);