/*

  Code to deal with Angular template files

*/

// Config for htmlmin when processing templates
const htmlMinOptions = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  collapseBooleanAttributes: true,
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: true
}

/**
 * Bundles the HTML templates into a JavaScript file that pre-caches them
 */
function preCache(source, name, watching = false) {
  let gulp = require('gulp');
  let htmlhint = require('gulp-htmlhint');
  let htmlmin = require('gulp-htmlmin');
  let templatecache = require('gulp-angular-templatecache');

  return gulp.src(source)
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(watching ? htmlhint.reporter() : htmlhint.failReporter())
    .pipe(htmlmin(htmlMinOptions))
    .pipe(templatecache({ 
      standalone: true, 
      filename: name + '.templates.js',
      module: name + '.templates',
      transformUrl: url => name + '/' + url
    }))
    .pipe(gulp.dest('build'));
}

exports.preCache = preCache;