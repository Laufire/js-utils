const { assign, entries, keys, values } = Object; // eslint-disable-line id-match
const { floor, random } = Math; // eslint-disable-line id-match

const rndBetween = (from = 0, to = 9) => // eslint-disable-line no-magic-numbers
	floor(random() * (to - from + 1)) + from;

export {
	assign, entries, keys, values,
	rndBetween,
};
