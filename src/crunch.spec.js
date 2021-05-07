/* Tested */
const { descend, index, summarize } = require('./crunch');

/* Helpers */
const { dict, secure, values } = require('./collection');

const sum = (...numbers) => numbers.reduce((t, c) => t + c, 0);

/* Spec */
describe('Crunch', () => {
	/* Mocks and Stubs */
	const elm1 = secure({a: 1, b: 2});
	const elm2 = secure({ a: 1, b: 3});
	const arr = secure([elm1, elm2]);
	const obj = secure(dict(arr));

	test('index builds and index the given collection '
	+ 'on the given keys of the children to help with retrieval', () => {
		const expected = { 1: { 2: elm1, 3: elm2 }};

		const indexedFromArr = index(arr, 'a', 'b');
		const indexedFromObj = index(obj, 'a', 'b');

		expect(indexedFromArr).toEqual(expected);
		expect(indexedFromObj).toEqual(expected);
	});

	test('summarize summarizes the given collection '
	+ 'and builds an index on the given keys', () => {
		const summarizer = (item) => sum(...values(item));
		const expected = { 1: { 2: 3, 3: 4 }};

		const summarizedFromArr = summarize(arr, summarizer, 'a', 'b');
		const summarizedFromObj = summarize(obj, summarizer, 'a', 'b');

		expect(summarizedFromArr).toEqual(expected);
		expect(summarizedFromObj).toEqual(expected);
	});

	test('descend descends into the given collection '
	+ 'upto the given level and executes the given process'
	+ 'and returns a new collection', () => {
		const process = (num) => num + 1;
		const expectedFromArr = [{ a: 2, b: 3}, { a: 2, b: 4}];
		const expectedFromObj = dict(expectedFromArr);

		const gotFromArr = descend(arr, process, 1);
		const gotFromObj = descend(obj, process, 1);

		expect(gotFromArr).toEqual(expectedFromArr);
		expect(gotFromObj).toEqual(expectedFromObj);
	});
});
