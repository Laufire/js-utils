/* eslint-disable id-length */
const path = require('path');
const { prepareEntry, mergeConfig } = require('./build/webpackManager');
const config = require('./build/config');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const entries = [
	{
		name: 'lib',
		entry: {
			// TODO: Reference commonchunks.
			'lib/index.js': './src/lib/index.js',
		},
		plugins: [new CleanWebpackPlugin()],
		output: {
			filename: '[name]',
		},
	},
	{
		name: 'module',
		entry: prepareEntry(config),
		resolve: {
			alias: {
				'./lib': path.resolve(__dirname, 'dist/lib'),
			},
		},
		output: {
			filename: 'module[name]',
		},
	},
];

module.exports = entries.map(mergeConfig);
