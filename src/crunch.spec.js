/* Tested */
const { index } = require('./crunch');

/* Helpers */
const { dict, secure } = require('./collection');

/* Spec */
describe('Crunch', () => {
	/* Mocks and Stubs */
	const elm1 = secure({a: 1, b: 2});
	const elm2 = secure({ a: 1, b: 3});
	const arr = secure([elm1, elm2]);
	const obj = secure(dict(arr));

	test('index builds and index the given collections '
	+ 'on the given keys to help with retrieval', () => {
		const expected = { 1: { 2: elm1, 3: elm2 }};

		const indexedFromArr = index(arr, 'a', 'b');
		const indexedFromObj = index(obj, 'a', 'b');

		expect(indexedFromArr).toEqual(expected);
		expect(indexedFromObj).toEqual(expected);
	});
});
