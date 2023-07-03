const path = require('path');
const { prepareEntry, mergeConfig } = require('./build/webpackManager');
const config = require('./build/config');

const entries = [
	{
		name: 'lib',
		entry: {
			// TODO: Reference commonchunks.
			'lib/index.js': './src/lib/index.js',
		},
		output: {
			filename: '[name]',
			clean: true,
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
