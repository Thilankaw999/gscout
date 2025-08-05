const path = require('path');
const { webpackConfig } = require('../../scripts/webpack.common');

module.exports = (options, webpack) => {
  const outDir = path.resolve(__dirname, '.dist');
  return webpackConfig(options, webpack, outDir)
}; 