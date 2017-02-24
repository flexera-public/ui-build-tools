/*

  Code to handle generating tasks that will watch and serve an app

*/

const _ = require('lodash');
const getRoots = require('./shared/getRoots');

function generate(bundle, config) {
  let gulp = require('gulp');

  // get all the root folders to watch based on the bundle's dependencies
  // by default, we also watch all @rightscale scoped packages because we may have
  // used npm link to work on them
  let watchFolders = getRoots(bundle, config.bundles).concat([
    '!**/*.build.scss',
    'node_modules/@rightscale/**/*',
    '!**/.*',
    '!node_modules/@rightscale/**/node_modules'
  ]);

  let watchTaskName = `${bundle.name}:watch`;
  let buildTaskName = `${bundle.name}:build`;

  if (process.argv[2] === watchTaskName) {
    global.watching = true;
  }

  gulp.task(watchTaskName, [buildTaskName], () => {
    let watch = require('gulp-watch');

    // watch for file changes and call the reload task
    watch(watchFolders,
      {
        followSymlinks: true, // allows using npm link
        verbose: true,        // shows the list of files changed
        read: false           // no need to read the content, speeds things up a bit
      },
      () => { gulp.start(buildTaskName); });
  });
}

exports.generate = generate;
