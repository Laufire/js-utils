/**
 * Utility functions to help with debugging.
 */

import { isDefined } from './reflection';

const peek = (value, label) =>
(
	// eslint-disable-next-line no-console, no-sequences
	console.log(...isDefined(label) ? [label] : [], value), value
);

const pretty = (value, indent = '\t') =>
	JSON.stringify(
		value, null, indent
	);

// eslint-disable-next-line no-magic-numbers
const sleep = (ms = 1000) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export {
	peek,
	pretty,
	sleep,
};
