/**
 * Random functions to help with testing.
 */

/* Imports */
import { keys, map, values, filter, reduce } from './collection';
import { rndBetween as rb } from './lib';

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
const rndBetween = rb;

/*
	NOTE: To by-pass seed matching of predefined names, use them twice.
	IE: 'charchar' instead of 'char'.
*/
/**
 * Get a random string from the pre-defined seed / custom string.
 * @param {integer} [8] length
 * @param {string} [char] seed
 * @returns { string} A random string.
 */
// eslint-disable-next-line no-magic-numbers
const rndString = (length = 8, seed = 'char') => {
	const seedString = stringSeeds[seed] || seed;
	const seedCharCount = seedString.length - 1;
	let ret = '';

	// eslint-disable-next-line no-param-reassign
	while(length--)
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

const rndValue = (collection) => {
	const items = values(collection);

	return items[rndBetween(0, items.length - 1)];
};

const rndValues = (() => {
	const skipRndKey = (iterable) => {
		const rndKey = rndValue(keys(iterable));

		return filter(iterable, (dummy, key) => key !== rndKey);
	};

	return (iterable, count = 1) => reduce(
		iterable, (t) => (keys(t).length > count
			? skipRndKey(t)
			: t), iterable
	);
})();

const rndValueWeighted = (weights) => {
	const candidates = keys(weights);
	const boundaries = values(map(weights, (value, key) => value
		+ candidates.slice(0, candidates.indexOf(key))
			.reduce((t, c) => t + weights[c], 0)));
	const start = 0;
	const end = (boundaries.slice(-1)[0] || 1) - 1;

	return () => {
		const marker = rndBetween(start, end);

		return candidates[
			boundaries.findIndex((boundary) => boundary > marker)
		];
	};
};

const withProb = (prob) => {
	// NOTE: Precision is not dynamic to avoid js floating point arithmetic.
	const precision = 1000;
	const inverse = (1 / prob * precision) - 1;

	return () => rndBetween(0, inverse) < precision;
};

export {
	rndBetween,
	rndString,
	rndOfString,
	rndValue,
	rndValues,
	rndValueWeighted,
	stringSeeds,
	withProb,
};
