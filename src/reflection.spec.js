/* Tested */
const {
	constructorName,
	inferType,
	isIterable,
	isFunction,
	isObject,
	isDefined,
} = require('./reflection');

describe('Reflection', () => {
	/* Mocks and Stubs */
	const obj = {};
	const arr = [];
	const fn = () => {};

	/* Tests */
	test('constructorName returns the constructor name '
		+ 'of the given value', () => {
		expect(constructorName(obj)).toEqual('Object');
		expect(constructorName(arr)).toEqual('Array');
	});

	test('inferType infers the type of the given value', () => {
		expect(inferType(obj)).toEqual('object');
		expect(inferType(1)).toEqual('number');
		expect(inferType(null)).toEqual('null');
		expect(inferType(undefined)).toEqual('undefined');
	});

	test('isIterable returns true only when the given value '
		+ 'is an Array or an Object', () => {
		expect(isIterable(obj)).toEqual(true);
		expect(isIterable(arr)).toEqual(true);
		expect(isIterable(fn)).toEqual(false);
	});

	test('isFunction returns true only when the given value '
		+ 'is a Function', () => {
		expect(isFunction(obj)).toEqual(false);
		expect(isFunction(fn)).toEqual(true);
	});

	test('isObject returns true only when the given value '
		+ 'is an Object', () => {
		expect(isObject(obj)).toEqual(true);
		expect(isObject(arr)).toEqual(false);
	});

	test('isDefined returns false only when the given value '
		+ 'is undefined', () => {
		expect(isDefined(undefined)).toEqual(false);
		expect(isDefined(obj)).toEqual(true);
	});
});
