(function () {
  'use strict';

  var gulp = require('gulp'),
      less = require('gulp-less'),
      uncss = require('gulp-uncss'),
      jade = require('gulp-jade'),
      concat = require('gulp-concat'),
      filesize = require('gulp-filesize'),
      uglify = require('gulp-uglify'),
      changed = require('gulp-changed'),
      watch = require('gulp-watch'),
      gutil = require('gulp-util');

  gulp.task('jade', function () {
    watch({
      glob: './client/app/**/*.jade'
    }, function (files) {
      return files.pipe(jade({locals: {}}))
        .pipe(gulp.dest('./build/partials'));
    });
  });

  gulp.task('css/less', function () {
    watch({
      glob: './client/app/**/*.less'
    }, function (files) {
      return files.pipe(less())
        .pipe(gulp.dest('./build/css'));
    });

    watch({
      glob: './client/app/**/*.css'
    }, function (files) {
      return files.pipe(gulp.dest('./build/css'));
    });

    watch({
      glob: './client/vendor/**/*.css'
    }, function (files) {
      return files.pipe(concat('vendor.css'))
        .pipe(gulp.dest('./build/css'));
    });
  });

  gulp.task('js', function () {
    gulp.src([
      './client/vendor/angular/angular.js',
      './client/vendor/jquery/jquery.js',
      './client/vendor/bootstrap/bootstrap.js',
      './client/vendor/**/*.js',
      './client/app/**/*.js'
    ]).pipe(concat('memorizy.js'))
    .pipe(gulp.dest('./build/js'));

    //watch({
     //glob: [
      //'./client/vendor/**/*.js',
    //*    './client/app/**/*.js'
    //*  ],
    //*  base: './client/'
    //*}, function (files) {
    //*  return files.pipe(concat('memorizy.js')).pipe(uglify())
    //*    .pipe(gulp.dest('./build/js'));
    //*});
    
  });

  gulp.task('assets', function () {
    gulp.src('./client/assets/**/*')
      .pipe(gulp.dest('./build/'));
  });

  gulp.task('default', [
    'jade', 
    'css/less',
    'js',
    'assets'
  ]);

})();
