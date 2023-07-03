const glob = require('glob');
const path = require('path');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.baseConfig');

const readComponents = (context) => {
	const { config: { entry, cwd, ignore }} = context;

	return {
		...context,
		data: glob.sync(entry, { cwd, ignore }),
	};
};

const transformPaths = (context) => {
	const { config: { cwd }, data } = context;
	const entry = data.reduce((acc, filePath) => {
		const { dir, name, ext } = path.parse(filePath);

		return {
			...acc,
			[`${ dir }/${ name }${ ext }`]: `${ cwd }/${ filePath }`,
		};
	}, {});

	return { ...context, data: entry };
};

const prepareEntry = (config) =>
	transformPaths(readComponents({ config })).data;

const mergeConfig = (extension) => merge(baseConfig, extension);

module.exports = {
	prepareEntry,
	mergeConfig,
};
