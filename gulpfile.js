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
      gutil = require('gulp-util'),
      exec = require('child_process').exec,
      karma = require('karma').server;


  gulp.task('jade', function () {
    watch('./client/app/**/*.jade', function (files) {
      return files.pipe(jade({locals: {}}))
        .pipe(gulp.dest('./build/partials'));
    });
  });

  gulp.task('css/less', function () {
    watch('./client/app/**/*.less', function (files) {
      return files.pipe(less())
        .pipe(gulp.dest('./build/css'));
    });

    watch('./client/app/**/*.css', function (files) {
      return files.pipe(gulp.dest('./build/css'));
    });

    watch('./client/vendor/**/*.css', function (files) {
      return files.pipe(concat('vendor.css'))
        .pipe(gulp.dest('./build/css'));
    });
  });

  gulp.task('js', function () {
    var glob = [
      './client/vendor/angular/angular.js',
      './client/vendor/jquery/jquery.js',
      './client/vendor/bootstrap/bootstrap.js',
      './client/vendor/**/*.js',
      './client/app/**/*.js'
    ];

    watch(glob, function (files) {
      return gulp.src(glob)
        .pipe(concat('memorizy.js'))
        //.pipe(uglify())
        .pipe(gulp.dest('./build/js'));
    });
    
  });

  gulp.task('assets', function () {
    gulp.src('./client/assets/**/*')
      .pipe(gulp.dest('./build/'));
  });

  var firstLaunch = true;
  gulp.task('client/tests', function() {
    watch('client/**/*.js', function(files) {
      if (firstLaunch) {
        karma.start({
          configFile: __dirname + '/karma.conf.js'
        });
        firstLaunch = false;
      }
    });
  });

  gulp.task('server/tests', function() {
    watch([
      'models/**/*.js',
      'middlewares/**/*.js',
      'routes/**/*.js',
      'utils/**/*.js',
      'db/**/*.js',
      'test/**/*.js',
      'app.js',
    ], { name: 'server/tests' }, function(files) {
      exec('mocha --reporter list', 
           function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
          });
    });
  });

  gulp.task('default', [
    'jade', 
    'css/less',
    'js',
    'assets',
    'client/tests',
    'server/tests'
  ]);

})();
