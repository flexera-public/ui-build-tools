/*

  Anything related to CSS generation

*/

function compile(entryPoint, source, destination, bundle) {
  let gulp = require('gulp');
  let sass = require('gulp-sass');
  let postcss = require('gulp-postcss');
  let atImport = require('postcss-import');
  let autoprefixer = require('autoprefixer');
  let mqpacker = require('css-mqpacker');
  let csswring = require('csswring');
  let sourcemaps = require('gulp-sourcemaps');
  let inject = require('gulp-inject');
  let rename = require('gulp-rename');

  return gulp.src(entryPoint)
    .pipe(sourcemaps.init())
    .pipe(inject(gulp.src(source), {
      starttag: '/* inject:imports */',
      endtag: '/* endinject */',
      transform: filepath => '@import "..' + filepath + '";'
    }))
    .pipe(rename('index.build.scss'))
    .pipe(gulp.dest(bundle.root))
    .pipe(sass().on('error', function() {
      sass.logError.apply(this, arguments);
      if (!global.watching) process.exit(1);
      this.emit('end');
    }))
    .pipe(rename(`${bundle.name}.css`))
    .pipe(postcss([
      atImport(),
      autoprefixer({ browsers: ['last 2 versions'] }),
      mqpacker({ sort: true }),
      csswring({ removeAllComments: true })
    ]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(destination))
}

exports.compile = compile;
