var gulp = require('gulp'),
    watch = require('gulp-watch'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename');


gulp.task('compress', function() {
    return gulp.src([
        'app/{users,events}/*.js',
        'app/app.js'
    ])
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('app/dist/'));
});

gulp.task('default', ['compress']);