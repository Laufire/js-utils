import { rndBetween } from '@laufire/utils/random';

const isProbable = (probability) =>
	// eslint-disable-next-line no-magic-numbers
	rndBetween(1, 100) <= probability * 100;

export { isProbable };
