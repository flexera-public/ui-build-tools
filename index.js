const _ = require('lodash');
const gulp = require('gulp');

const bundleTasks = require('./lib/bundle');
const watch = require('./lib/watch');

function init(config) {

  let fs = require('fs');
  if (fs.existsSync('build.local.json')) {
    let overrides = JSON.parse(fs.readFileSync('build.local.json'));
    config = _.defaults(overrides, config);
  }

  if (!config.bundles) {
    error('Please provide at least one bundle');
  }

  let generated = [];
  let todo = _.map(config.bundles, b => b.name);

  while (todo.length) {
    let clone = _.clone(todo);
    for (let i = clone.length - 1; i >= 0; i--) {
      let bundle = _.find(config.bundles, b => b.name === clone[i]);

      if (!/^[\w\.-]+$/.test(bundle.name)) {
        error('Invalid bundle name: ' + bundle.name);
      }

      if (_.intersection(bundle.dependencies, generated).length === (bundle.dependencies || []).length) {
        bundleTasks.generate(bundle, config);
        watch.generate(bundle, config);
        todo.splice(i, 1);
        generated.push(bundle.name);
      }
    }

    if (todo.length === clone.length) {
      error('Could not generate tasks for all bundles. Check for circular or missing dependencies');
    }
  }

  gulp.task('clean', config.beforeClean || [], cb => {
    var del = require('del');
    return del(['build/**/*', '.tmp/**/*', 'dist/**/*', '**/index.build.scss']);
  });
}

function error(message) {
  console.error('[Build Tools]: ' + message);
  process.exit(1);
}

exports.init = init;