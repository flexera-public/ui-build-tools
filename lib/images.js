/*

  Generation of image related Gulp tasks

*/

function preCache(source, name, moduleName) {
  let gulp = require('gulp');
  let svgmin = require('gulp-svgmin');
  let templatecache = require('gulp-angular-templatecache');

  return gulp.src(source)
    .pipe(svgmin())
    .pipe(templatecache({
      standalone: true,
      filename: name + '.images.js',
      module: name + '.images'
    }))
    .pipe(gulp.dest('build'));
}

exports.preCache = preCache;
