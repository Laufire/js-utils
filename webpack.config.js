/* eslint-disable id-length */
const path = require('path');
const { prepareEntry, mergeConfig } = require('./lib/webpackManager');
const config = require('./lib/config');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// Todo: Consider to use generator insted mergeConfig.
module.exports = [
	mergeConfig({
		entry: {
			'lib/index.js': './src/lib/index.js',
		},
		plugins: [new CleanWebpackPlugin()],
		output: {
			filename: '[name]',
		},
	}),
	mergeConfig({
		entry: prepareEntry(config),
		resolve: {
			alias: {
				'./lib': path.resolve(__dirname, 'dist/lib'),
			},
		},
		output: {
			filename: 'module[name]',
		},
	}),
];
