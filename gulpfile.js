var gulp = require('gulp');
var eslint = require('gulp-eslint');
var zip = require('gulp-zip');

var FILES = [
  'views/*.js',
  'routes/*.js',
  'models/firebase.js',
  'app.js'
];

gulp.task('eslint', function () {
  return gulp.src(FILES)
    .pipe(eslint({}))
    .pipe(eslint.format());
});

gulp.task('zip', function () {
  return gulp.src(FILES, { base: '.' })
    .pipe(zip('files.zip'))
    .pipe(gulp.dest(''));
});
