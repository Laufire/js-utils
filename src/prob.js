import { rndBetween } from './lib';

const isProbable = (probability) =>
	// eslint-disable-next-line no-magic-numbers
	rndBetween(1, 101) <= probability * 100;

export { isProbable };
