// eslint-disable-next-line id-match
const { assign, entries, keys, values } = Object;
// eslint-disable-next-line id-match
const { floor, random } = Math;

// eslint-disable-next-line no-magic-numbers
const rndBetween = (from = 0, to = 9) =>
	floor(random() * (to - from + 1)) + from;

export {
	assign, entries, keys, values,
	rndBetween,
};
