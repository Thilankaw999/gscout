const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

const lazyImports = [
  '@nestjs/microservices/microservices-module',
  '@nestjs/websockets/socket-module',
  'class-transformer/storage',
];

module.exports = {
  webpackConfig: (options, webpack, outputPath) => {
    // Webpack configuration for bundling the application with AWS SDK v3 included
    return {
      ...options,
      devtool: false,
      mode: 'production',
      externals: ['aws-sdk'],
      output: {
        ...options.output,
        libraryTarget: 'commonjs2',
        path: outputPath,
        filename: 'main.js',
      },
      target: 'node',
      plugins: [
        ...options.plugins,
        new webpack.IgnorePlugin({
          checkResource(resource) {
            if (lazyImports.includes(resource)) {
              try {
                require.resolve(resource);
              } catch (err) {
                return true;
              }
            }

            return false;
          },
        }),
      ],
      optimization: {
        usedExports: true,
        sideEffects: true,
        providedExports: true,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              mangle: true,
              keep_classnames: true,
              keep_fnames: true,
              compress: {
                unused: true,
                dead_code: true,
                conditionals: true,
                evaluate: true,
              },
            },
            extractComments: false,
          }),
        ],
      },
    };
  },
};
