const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    landing: './src/pages/landing/landing.js',
    registration: './src/pages/registration/registration.js',
    auction: './src/pages/auction/auction.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: 'development',
  devServer: {
    static: './dist',
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.html$/i,
        include: path.resolve(__dirname, 'src/components'),
        type: 'asset/source',
      }
    ],

  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/landing/index.html',
      filename: 'index.html',
      chunks: ['landing'],
    }),

    new HtmlWebpackPlugin({
      template: './src/pages/registration/registration.html',
      filename: 'registration.html',
      chunks: ['registration'],
    }),


    new HtmlWebpackPlugin({
      template: './src/pages/auction/auction.html',
      filename: 'auction.html',
      chunks: ['auction'],
    }),
  ],
};
