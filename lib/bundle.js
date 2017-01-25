/*

  Code to generate the various Gulp tasks involved in building a given bundle.
  This covers detecting which tasks are to be generated based on the bundle's config
  and the files present in the bundle.

*/

const _ = require('lodash');
const fs = require('fs');
const glob = require('glob');
const gulp = require('gulp');
const karma = require('karma');

const code = require('./code');
const templates = require('./templates');
const images = require('./images');
const styles = require('./styles');

// defines spec tasks with their matching browser so we can dynamically generate
// a karma task for each browser setup
let specsTasks = {
  'spec': ['PhantomJS'],
  'spec:chrome': ['Chrome'],
  'spec:ie': ['IE'],
  'spec:firefox': ['Firefox'],
  'spec:edge': ['Edge'],
  'spec:windows': ['Chrome', 'Firefox', 'IE', 'Edge'],
  'spec:linux': ['Chrome', 'Firefox']
}

// Keep track of the style tasks generated so we can depend on them
let styleTasks = [];

function generate(bundle, minify) {
  let buildDeps = [];
  let compileDeps = [];
  let root = (bundle.root + '/').replace('//', '/');

  // by default, we assume the bundle supports Angular 1.x and so we look for templates and images
  // so we can pre-cache them
  if (bundle.angular || typeof bundle.angular === 'undefined') {
    // Look for HTML files in subfoldes
    let htmlFiles = glob.sync(`${root}**/*.html`, { ignore: `${root}*.html` });
    if (htmlFiles.length) {
        // If any, add template pre-cache task
        let taskName = `${bundle.name}:templates`;
        gulp.task(taskName, () => templates.preCache([`${root}**/*.html`, `!${root}*.html`], bundle.name));
        compileDeps.push(taskName);
    }

    // Look for SVG files in bundle
    let svgFiles = glob.sync(`${root}**/*.svg`);
    if (svgFiles.length) {
        // If any, add images pre-cache task
        let taskName = `${bundle.name}:images`;
        gulp.task(taskName, () => images.preCache(`${root}**/*.svg`, bundle.name));
        compileDeps.push(taskName);
    }
  }

  // Look for TypeScript entry point in bundle
  if (fs.existsSync(`${root}index.ts`)) {
    // Create task to verify code
    let verifyName = `${bundle.name}:code:verify`;
    gulp.task(verifyName, () =>
      code.verify([`${root}**/*.ts`, `!${root}**/*.d.ts`, `!${root}spec.ts`, `!${root}**/*.spec.ts`, `!${root}spec/**/*`])
    );
    compileDeps.push(verifyName);

    // Create task to compile code
    let taskName = `${bundle.name}:code:compile`;
    gulp.task(taskName, compileDeps, () => code.compile(
      `${root}index.ts`, 
      `${bundle.dist ? 'dist' : 'build'}/js/${bundle.name}.js`, 
      minify, 
      bundle.library)
    );
    buildDeps.push(taskName);
  }

  // Look for SCSS entry point
  if (fs.existsSync(`${root}index.scss`)) {
    let deps = _.intersection(styleTasks, _.map(bundle.dependencies, d => d + ':styles'));
    let taskName = `${bundle.name}:styles`;
    gulp.task(taskName, deps, () => styles.compile(
      `${root}index.scss`, 
      `${root}**/_*.scss`, 
      `${bundle.dist ? 'dist' : 'build'}/css/`, 
      bundle)
    );
    buildDeps.push(taskName);
    styleTasks.push(taskName);
  }

  gulp.task(`${bundle.name}:build`, buildDeps.concat(_.map(bundle.dependencies, d => d + ':build')), () => {
    let ignore = require('gulp-ignore');

    // Copy anything at the bundle root that's not a ts or scss file into the destination
    return gulp.src([`${root}*`, `!${root}*.ts`, `!${root}*.scss`])
      .pipe(ignore(file => !file.contents)) // ignore directories
      .pipe(gulp.dest(bundle.dist ? 'dist' : 'build'));
  });

  // Look for tests entry point
  if (fs.existsSync(`${root}spec.ts`)) {
    // Create task to verify code
    let verifyName = `${bundle.name}:spec:verify`;
    gulp.task(verifyName, () => code.verify([`${root}**/*.ts`, `!${root}**/*.d.ts`]));

    // Create task to inject a reference to all spec files in spec.ts
    let injectName = `${bundle.name}:spec:inject`;
    gulp.task(injectName, () => {
      let inject = require('gulp-inject');
      return gulp.src('src/spec.ts')
        .pipe(inject(gulp.src('src/**/*.spec.ts'), {
          starttag: '/* inject:specs */',
          endtag: '/* endinject */',
          transform: filepath => "import '../.." + filepath + "';"
        }))
        .pipe(gulp.dest(`.tmp/${bundle.name}`));
    });

    // Create task to compile code
    let compileName = `${bundle.name}:spec:compile`;
    gulp.task(compileName, [verifyName, injectName].concat(compileDeps), () =>
      code.compile(
        `.tmp/${bundle.name}/spec.ts`, 
        `.tmp/${bundle.name}.spec.js`, 
        minify,
        false)
    );

    // Build spec tasks for all browsers
    _.forEach(specsTasks, (v, k) => {
      // Run the specs in the given browser
      gulp.task(`${bundle.name}:${k}`, [compileName], () => {
        let path = require('path');
        new karma.Server(
          {
            configFile: path.resolve('karma.conf.js'),
            browsers: v,
            files: [
              `.tmp/${bundle.name}.spec.js`,
              { pattern: `.tmp/${bundle.name}.spec.js.map`, included: false }
            ]
          }).start();
      });

      // Run the specs in debug mode
      if (k.indexOf(':') > 0) {
        gulp.task(`${bundle.name}:${k}:debug`, [compileName], () => {
          let path = require('path');
          new karma.Server(
            {
              configFile: path.resolve('karma.conf.js'),
              browsers: v,
              files: [
                `.tmp/${bundle.name}.spec.js`,
                { pattern: `.tmp/${bundle.name}.spec.js.map`, included: false }
              ],
              singleRun: false
            }).start();
        });
      }
    });
  }
}

exports.generate = generate;
