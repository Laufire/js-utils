/**
 * Utility functions to help with debugging.
 */

import { isDefined } from './reflection';

const peek = (value, label) =>
	(console.log(...isDefined(label) ? [label] : [], value), value); // eslint-disable-line no-console, no-sequences

const sleep = (ms = 1000) => // eslint-disable-line no-magic-numbers
	new Promise((resolve) => setTimeout(resolve, ms));

export {
	peek,
	sleep,
};
