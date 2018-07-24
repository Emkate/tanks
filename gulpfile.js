var gulp = require('gulp');
var sass = require('gulp-sass');
var babel = require('gulp-babel')

gulp.task('scss', () => {
  return gulp.src('./src/sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./public'));
});

gulp.task('js', () => {
  return gulp.src('./src/js/*.js')
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(gulp.dest('./public'));
})

gulp.task('socket', () => {
  return gulp.src('./node_modules/socket.io-client/dist/socket.io.js')
    .pipe(gulp.dest('./public'))
})

gulp.task('server', () => {
  gulp.src('./src/*.js')
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(gulp.dest('./'));
})

gulp.task('default', [ 'scss', 'js', 'socket' ]);