import { rndBetween } from './random';

const hundred = 100;

const vary = (variance) =>
	rndBetween(hundred - (variance * hundred),
		hundred + (variance * hundred)) / hundred;

const getDR = (numOne, numTwo) =>
	(numTwo
		? Math.abs((numTwo - numOne) / numTwo)
		: numOne ? Infinity : 0);

export {
	vary,
	getDR,
};
