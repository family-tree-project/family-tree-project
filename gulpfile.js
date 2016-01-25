var gulp = require('gulp');
var karmaServer = require('karma').Server;
var mocha = require('gulp-mocha');
var concatCss = require('gulp-concat-css');
var minifyCss = require('gulp-minify-css');
var sass = require('gulp-sass');
var maps = require('gulp-sourcemaps');
var webpack = require('webpack-stream');
var jshint = require('gulp-jshint');

// Covering JS for server, router, database models, and any library files.
var backendFiles = ['server.js',
                 __dirname + '/routes/**/*.js',
                 __dirname + '/models/**/*.js',
                 __dirname + '/lib/**/*.js'];

// Covering all JS for client-side.
var appFiles = [__dirname + '/app/**/*.js'];

// All test files, including gulpfile (bundled for linting purposes)
var testFiles = [__dirname + '/test/**/*.js',
                'gulpfile.js'];

// Any files copied directly to build folder, including HTML & images.
var staticFiles = ['app/**/*.html'];

/* * * * * * * * * * * * * * * * * *
            BUILD TASKS
 * * * * * * * * * * * * * * * * * */

gulp.task('static:dev', function() {
  gulp.src(staticFiles)
  .pipe(gulp.dest('build/'));
});

// Bundles all client-side JS.
gulp.task('webpack:dev', function() {
  return gulp.src('app/js/entry.js')
  .pipe(webpack({
    output: {
      filename: 'bundle.js'
    }
  }))
  .pipe(gulp.dest('build/'));
});

gulp.task('styles:dev', function() {
  return gulp.src(['app/styles/**/*.scss'])
    .pipe(maps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(concatCss('styles.min.css'))
    .pipe(minifyCss())
    .pipe(maps.write('./'))
    .pipe(gulp.dest('build/styles/'));
});

// task to watch for css changes
// gulp.task('css:watch', function () {
//   gulp.watch('app/**/styles/*.css', ['styles:dev']);
// });

gulp.task('images:dev', function() {
  gulp.src('app/images/leaflet/*.png')
  .pipe(gulp.dest('build/images/leaflet/'));
});

// For client-side tests.
// gulp.task('webpack:test', function() {
//   return gulp.src('test/client/test_entry.js')
//   .pipe(webpack ({
//     output: {
//       filename: 'test_bundle.js'
//     }
//   }))
//   .pipe(gulp.dest('test/client/'));
// });

/* * * * * * * * * * * * * * * * * *
            LINT TASKS
 * * * * * * * * * * * * * * * * * */

gulp.task('jshint:backendFiles', function() {
  return gulp.src(backendFiles)
    .pipe(jshint({
      node: true,
    }))
    .pipe(jshint.reporter('default'));
});

gulp.task('jshint:testFiles', function() {
  return gulp.src(testFiles)
    .pipe(jshint({
      node: true,
      globals: {
        angular: true,
        before: true,
        after: true,
        it: true,
        expect: true
      }
    }))
    .pipe(jshint.reporter('default'));
});

gulp.task('jshint:appFiles', function() {
  return gulp.src(appfiles)
    .pipe(jshint({
      node: true,
      globals: {
        angular: true
      }
    }))
    .pipe(jshint.reporter('default'));
});

/* * * * * * * * * * * * * * * * * *
            TEST TASKS
 * * * * * * * * * * * * * * * * * */

gulp.task('mocha', function() {
  return gulp.src(backendFiles)
    .pipe(mocha());
});

gulp.task('karma', function() {
  new karmaServer({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

/* * * * * * * * * * * * * * * * * *
            WATCH TASKS
 * * * * * * * * * * * * * * * * * */

gulp.task('build:watch', function() {
  gulp.watch(staticFiles, ['static:dev']);
  gulp.watch(appFiles, ['webpack:dev', 'karma']);
  gulp.watch('app/styles/**/*.scss', ['styles:dev']);
  //gulp.watch('test/client/*.js', ['webpack:test']);
});

gulp.task('app:watch', function() {
  gulp.watch(backendFiles, ['jshint:backendFiles', 'mocha']);
  gulp.watch(testFiles, ['jshint:testfiles']);
});

/* * * * * * * * * * * * * * * * * *
        QUICK TASKS & DEFAULT
 * * * * * * * * * * * * * * * * * */

gulp.task('build', ['static:dev', 'webpack:dev', 'styles:dev']);
gulp.task('lint', ['jshint:backendFiles', 'jshint:testfiles', 'jshint:devfiles']);
gulp.task('test', ['mocha', 'karma']);
gulp.task('watch', ['build:watch', 'app:watch']);
gulp.task('default', ['build', 'watch']);
