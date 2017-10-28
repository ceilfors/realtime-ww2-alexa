const path = require('path')
// eslint-disable-next-line import/no-unresolved
const slsw = require('serverless-webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const addBabelPolyfill = (slsEntries) => {
  return Object.keys(slsEntries)
    .reduce((acc, key) => Object.assign(acc, {
      [key]: ['babel-polyfill', 'source-map-support/register', slsEntries[key]]
    }), {})
}

module.exports = {
  entry: addBabelPolyfill(slsw.lib.entries),
  target: 'node',
  devtool: 'source-map',
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: __dirname,
      exclude: /node_modules/
    }]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  },
  externals: [
    'aws-sdk'
  ],
  plugins: [
    new CopyWebpackPlugin([
          { from: '.serverless-secret.json' }
    ])
  ]
}
