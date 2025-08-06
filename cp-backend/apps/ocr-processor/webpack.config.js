const path = require('path');

module.exports = {
  ...require('../../scripts/webpack.common.js'),
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, '.dist'),
    filename: 'main.js',
    libraryTarget: 'commonjs2',
  },
};
