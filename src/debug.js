/**
 * Utility functions to help with debugging.
 */

const peek = (x) =>
	(console.log(x), x); // eslint-disable-line no-console, no-sequences

const sleep = (ms = 1000) => // eslint-disable-line no-magic-numbers
	new Promise((resolve) => setTimeout(resolve, ms));

export {
	peek,
	sleep,
};
