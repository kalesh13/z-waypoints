const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const uglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        library: 'zWaypoint',
        libraryTarget: 'umd',
        libraryExport: 'default',
        path: path.resolve(__dirname, 'build'),
        filename: 'index.js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: ['babel-loader']
        }]
    },
    plugins: [
        new uglifyJsPlugin(),
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, 'index.html')
        })
    ]
};