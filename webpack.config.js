/* eslint-disable id-length */
const path = require('path');
const { prepareEntry } = require('./lib/webpackManager');
const config = require('./lib/config');
const nodeExternals = require('webpack-node-externals');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { merge } = require('webpack-merge');

const common = {
	mode: 'production',
	externals: [nodeExternals()],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
		],
	},
	output: {
		path: path.resolve(__dirname, 'dist/'),
		libraryTarget: 'commonjs',
	},
};

module.exports = [
	merge(common, {
		entry: {
			'lib/index.js': './src/lib/index.js',
		},
		plugins: [new CleanWebpackPlugin()],
		output: {
			filename: '[name]',
		},
	}),
	merge(common, {
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
