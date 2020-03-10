module.exports = (api) => {
	api.cache(true);
	return {
		plugins: [
			[
				'@babel/plugin-transform-runtime',
				{
					regenerator: true,
				},
			],
		],
		presets: [
			'@babel/preset-env',
		],
	};
};
