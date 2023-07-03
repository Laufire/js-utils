const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
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
		path: path.resolve(__dirname, '../dist/'),
		libraryTarget: 'commonjs',
	},
};
