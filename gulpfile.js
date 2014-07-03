var gulp = require('gulp'),
    jade = require('gulp-jade'),
    uncss = require('gulp-uncss');

gulp.task('default', function() {
  gulp.src('./src/**/*.css')
    .pipe(uncss({

});
