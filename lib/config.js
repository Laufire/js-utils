
const config = {
	entry: '*.js',
	cwd: './src',
	// Introduce multiple extension as extensions: [.js, '.jsx']
	ignore: [
		'**/*.test.js',
		'**/*.spec.js',
		'**/setupTests.js',
	],
};

module.exports = config;
