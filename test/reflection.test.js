/* Tested */
const {
	constructorName,
	inferType,
	isIterable,
	isFunction,
	isObject,
} = require('../src/reflection');

describe('Reflection', () => {
	/* Mocks and Stubs */
	const obj = {};
	const arr = [];
	const fn = () => {};

	/* Tests */
	test('constructorName should return the constructor name '
		+ 'of the given value', () => {
		expect(constructorName(obj)).toEqual('Object');
		expect(constructorName(arr)).toEqual('Array');
	});

	test('inferType should infer the type of the given value', () => {
		expect(inferType(obj)).toEqual('object');
		expect(inferType(1)).toEqual('number');
		expect(inferType(null)).toEqual('null');
		expect(inferType(undefined)).toEqual('undefined');
	});

	test('isIterable should return true only when the given value '
		+ 'is an Array or an Object', () => {
		expect(isIterable(obj)).toEqual(true);
		expect(isIterable(arr)).toEqual(true);
		expect(isIterable(fn)).toEqual(false);
	});

	test('isFunction should return true only when the given value '
		+ 'is a Function', () => {
		expect(isFunction(obj)).toEqual(false);
		expect(isFunction(fn)).toEqual(true);
	});

	test('isObject should return true only when the given value '
		+ 'is an Object', () => {
		expect(isObject(obj)).toEqual(true);
		expect(isObject(arr)).toEqual(false);
	});
});
