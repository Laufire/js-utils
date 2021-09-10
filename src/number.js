import { rndBetween } from './random';

const hundred = 100;

const varry = (variance) =>
	rndBetween(hundred - (variance * hundred),
		hundred + (variance * hundred)) / hundred;

export {
	varry,
};
