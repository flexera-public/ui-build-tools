const _ = require('lodash');

/**
 * Recursively builds an array of root folder for a bundle and all of its dependencies.
 */
function getRoots(bundle, bundles) {
  let roots = [(bundle.root + '/').replace('//', '/')];
  _.forEach(bundle.dependencies, d => {
    let dep = _.find(bundles, b => b.name === d);
    roots = roots.concat(getRoots(dep, bundles));
  });
  return roots;
}

module.exports = getRoots;
