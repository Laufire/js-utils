import { rndBetween } from './random';

const hundred = 100;

const vary = (variance) =>
	rndBetween(hundred - (variance * hundred),
		hundred + (variance * hundred) + 1) / hundred;

// TODO: Revisit.
const getDR = (numOne, numTwo) =>
	(numTwo
		? Math.abs((numTwo - numOne) / numTwo)
		: numOne ? Infinity : 0);

export {
	vary,
	getDR,
};
