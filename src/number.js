import { rndBetween } from './random';

const hundred = 100;

const vary = (variance) =>
	rndBetween(hundred - (variance * hundred),
		hundred + (variance * hundred)) / hundred;

const getDR = (actual, expected) =>
	Math.abs((expected - actual) / expected);

export {
	vary,
	getDR,
};
