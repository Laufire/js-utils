/**
 * Utility functions to help with debugging.
 */

const peek = (x) => {
	console.log(x);
	return x;
};

const sleep = async (ms = 1000) =>
	new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {

	peek,
	sleep,
}
