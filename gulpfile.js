var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

var js_src_path = 'js/**/*.js';
var output_path = 'dist'

gulp.task('js', function () {
  return gulp.src(js_src_path)
    .pipe(concat('missionhub-js.js'))
    .pipe(gulp.dest(output_path))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(output_path));
});

gulp.task('default', ['js']);

gulp.task("watch", ['js'], function() {
  // calls "build-js" whenever anything changes
  gulp.watch(js_src_path, ["js"]);
});