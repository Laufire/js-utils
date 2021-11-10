import { getDR } from './number';

const isAcceptable = (
	actual, expected, margin
) => getDR(actual, expected) <= margin;

export {
	isAcceptable,
};
