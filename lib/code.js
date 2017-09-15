/*

  Everything related to TypeScript code: compilation, linting, errors...

*/

let projects = {};

/**
 * Compiles TypeScript source files into a bundled JavaScript file
 */
function compile(source, destination, minify, library, globals) {
  let rollup = require('rollup');
  let typescript = require('rollup-plugin-typescript2');
  let commonjs = require('rollup-plugin-commonjs');
  let nodeResolve = require('rollup-plugin-node-resolve');
  let uglify = require('rollup-plugin-uglify');
  let json = require('rollup-plugin-json');
  let _ = require('lodash');

  let plugins = [
    typescript({
      typescript: require('typescript'),
      baseUrl: './node_modules'
    }),
    json()
  ]

  let external = _.keys(globals);

  if (!library) {
    plugins = plugins.concat([
      commonjs({
        include: 'node_modules/**'
      }),
      nodeResolve({
        jsnext: true,
        main: true,
        browser: true,
        extensions: ['.js', '.ts', '.json'],
        preferBuiltins: false
      })
    ]);
  }
  else {
    let fs = require('fs');
    external = function (id) {
      return id[0] !== '.' && (fs.existsSync('node_modules/' + id) || fs.existsSync('node_modules/' + id + '.js'));
    }
  }

  if (minify) {
    plugins.push(uglify({ mangle: { keep_fnames: true }, compress: { keep_fnames: true } }));
  }

  return rollup.rollup({
    input: source,
    plugins: plugins,
    sourcemap: true,
    external: external
  }).then(bundle => {
    return bundle.write({
      output: {
        file: destination,
        format: library ? 'cjs' : globals ? 'iife' : 'es'
      },
      sourcemap: true,
      globals: globals
    });
  })
}

/**
 * Verifies TypeScript code using tslint and the TypeScript compiler
 */
function verify(glob) {
  let tslint = require('gulp-tslint');
  let gulp = require('gulp');
  // let ts = require('gulp-typescript');
  // let tsProject = ts.createProject('tsconfig.json', { noEmit: true, baseUrl: './node_modules' });

  let result = gulp.src(glob)
    .pipe(tslint({
      formattersDirectory: 'node_modules/custom-tslint-formatters/formatters',
      formatter: 'grouped'
    }))
    .pipe(tslint.report({
      summarizeFailureOutput: true
    }))
    .on('error', function () {
      if (!global.watching) process.exit(1);
      this.emit('end');
    // })
    // .pipe(tsProject())
    // .once("error", function () {
    //   this.once("finish", () => {
    //     if (!global.watching) process.exit(1);
    //   });
    //   this.emit('end');
    });

  return result.js;
}

exports.compile = compile;
exports.verify = verify;
