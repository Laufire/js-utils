/**
 * Random functions to help with testing.
 */

/* Imports */
const { floor, random } = Math; // eslint-disable-line id-match

/* Data */

/* Exports */
const stringSeeds = {
	char: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	hex: '0123456789ABCDEF',
	num: '0123456789',
};

/**
 *
 * @param {Integer} [0] from - The start of the range.
 * @param {Integer} [1] to - The end of the range.
 * @returns {integer} A random number between from and to.
 */
const rndBetween = (from = 0, to = 9) => // eslint-disable-line no-magic-numbers
	floor(random() * (to - from + 1)) + from;

/**
 * Get a random string from the pre-defined seed / custom string.
 * @param {integer} [8] length
 * @param {string} [char] seed
 * @returns { string} A random string.
 */
const rndString = (length = 8, seed = 'char') => { // eslint-disable-line no-magic-numbers
	// # NOTE: To by-pass seed matching of predefined names, use them twice. IE: 'charchar' instead of 'char'.
	const seedString = stringSeeds[seed] || seed;
	const seedCharCount = seedString.length - 1;
	let ret = '';

	while(length--) // eslint-disable-line no-param-reassign
		ret += seedString.substr(rndBetween(0, seedCharCount), 1);

	return ret;
};

/**
 * Get a random substring from the given string.
 * @param {string} string - The seed string.
 * @returns {string} The resulting random substring.
 */
const rndOfString = (string) =>
	Array.from(new Set(rndString(rndBetween(1, string.length), string)
		.split(''))).join('');

export {
	rndBetween,
	rndString,
	rndOfString,
	stringSeeds,
};
