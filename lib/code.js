/*

  Everything related to TypeScript code: compilation, linting, errors...

*/

let projects = {};

/**
 * Compiles TypeScript source files into a bundled JavaScript file
 */
function compile(source, destination, minify, library) {
  let rollup = require('rollup');
  let typescript = require('rollup-plugin-typescript');
  let commonjs = require('rollup-plugin-commonjs');
  let nodeResolve = require('rollup-plugin-node-resolve');
  let uglify = require('rollup-plugin-uglify');

  let plugins = [
    typescript({
      typescript: require('typescript'),
      baseUrl: './node_modules'
    })
  ]

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

  if (minify) {
    plugins.push(uglify({ mangle: { keep_fnames: true }, compress: { keep_fnames: true } }));
  }

  return rollup.rollup({
    entry: source,
    plugins: plugins,
    sourceMap: true,
  }).then(bundle => {
    return bundle.write({
      dest: destination,
      sourceMap: true,
      format: library ? 'cjs' : 'es'
    });
  })
}

/**
 * Verifies TypeScript code using tslint and the TypeScript compiler
 */
function verify(glob) {
  let tslint = require('gulp-tslint');
  let gulp = require('gulp');
  let ts = require('gulp-typescript');
  let tsProject = ts.createProject('tsconfig.json', { noEmit: true, baseUrl: './node_modules' });

  let result = gulp.src(glob)
    .pipe(tslint({
      formattersDirectory: 'node_modules/custom-tslint-formatters/formatters',
      formatter: 'grouped'
    }))
    .pipe(tslint.report({
      summarizeFailureOutput: true
    }))
    .on('error', () => {
      if (!global.watching) process.exit(1);
    })
    .pipe(tsProject())
    .once("error", function () {
      this.once("finish", () => {
        if (!global.watching) process.exit(1);
      });
    });

  return result.js;
}

exports.compile = compile;
exports.verify = verify;
