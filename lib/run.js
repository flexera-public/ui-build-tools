/*

  Code to handle generating tasks that will watch and serve an app

*/

const _ = require('lodash');
const getRoots = require('./shared/getRoots');

function generate(config) {
  let gulp = require('gulp');

  // Get the bundle to run
  let bundle = _.find(config.bundles, b => b.name === config.run.bundle);
  if (!bundle) {
    console.log(`Could not find bundle ${config.run.bundle} to run`);
    process.exit(1);
  }

  // get all the root folders to watch based on the bundle's dependencies
  // by default, we also watch all @rightscale scoped packages because we may have
  // used npm link to work on them
  let watchFolders = getRoots(bundle, config.bundles).concat([
    '!**/*.build.scss',
    'node_modules/@rightscale/**/*', 
    '!**/.*', 
    '!node_modules/@rightscale/**/node_modules'
  ]);
  
  // get host and port from config or default
  let host = config.run.host || 'localhost';
  let port = config.run.port || '3000';

  // make a default environment or replace with the ones from config if there are any
  let environments = {};
  environments[config.run.bundle] = {};
  if (config.run.environments) {
    environments = config.run.environments;
  }

  // host parts are used to sort out the domain for cookie rewriting
  let parts = host.split('.');

  let bs = require('browser-sync').create();

  // the reload task builds the bundle and caches the result in order to filter out unchanged files
  // in theory only the modified files will be passed to browsersync for refresh
  gulp.task('reload', [`${bundle.name}:build`], () => {
    var cache = require('gulp-cached');
    var ignore = require('gulp-ignore');

    return gulp.src(['./build/**/*', './dist/**/*', '!**/*.map'])
      .pipe(cache()) // ignore files that haven't changed
      .pipe(ignore(file => !file.contents)) // ignore directories
      .pipe(bs.stream()); // reload the page or inject CSS
  });

  // loop through the environment to create a run task for each
  _.forEach(environments, (endpointUrls, name) => {

    if (process.argv[2] === name) {
      global.watching = true;
    }

    gulp.task(name, ['reload'], () => {
      let modRewrite = require('connect-modrewrite');
      let watch = require('gulp-watch');
      let middleware = [];

      // if there are endpoints, we need to proxy API calls
      if (!_.isEmpty(endpointUrls)) {
        // in that case, we warn the user if no valid domain can be inferred from the host setting.
        // Chrome for example will only handle cookie domains if they have a dot in them
        if (parts.length < 2) {
          console.warn(`Disabling cookie rewrite on run because [${host}] is not a valid domain`);
        }

        let proxy = require('http-proxy-middleware');

        // for each endpoint, we create a proxy middleware
        _.forEach(endpointUrls, (target, path) => {
          let proxyConfig = {
            target: target,
            ws: true,
            prependPath: false,
            cookieDomainRewrite: parts.length <= 1 ? false : `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
          };

          if (config.run.customHeaders) {
            proxyConfig.headers = config.run.customHeaders;
          }

          middleware.push(proxy(path, proxyConfig))
        })
      }

      // URL rewrite middleware is used to send anything without an extension back to index.html
      // this enables Angular's HTML5 mode
      middleware.push(modRewrite([
        '!\\.\\w+(\\?.*)?$ /index.html [L]'
      ]));

      // watch for file changes and call the reload task
      watch(watchFolders,
        {
          followSymlinks: true, // allows using npm link
          verbose: true,        // shows the list of files changed
          read: false           // no need to read the content, speeds things up a bit
        },
        () => { gulp.start('reload'); });

      // run browser sync for live reload and css injection
      bs.init({
        open: false,
        host: host,
        port: port,
        https: config.run.https,
        reloadOnRestart: true,
        ghostMode: false,
        socket: {
          domain: `${host}:${port}`
        },
        server: {
          baseDir: ['./build', './dist'],
          middleware: middleware
        }
      });
    });
  });    
}

exports.generate = generate;
