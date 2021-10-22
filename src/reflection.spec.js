/* Tested */
import { map } from './collection';
import {
	constructorName,
	inferType,
	isCollection,
	isIterable,
	isFunction,
	isDict,
	isObject,
	isDefined,
} from './reflection';

describe('Reflection', () => {
	/* Mocks and Stubs */
	const obj = {};
	const arr = [];
	const fn = function () {};
	const Constructor = fn;

	/* Tests */
	test('constructorName returns the constructor name'
	+ ' of the given value', () => {
		const expectations = {
			Object: obj,
			Array: arr,
			Function: fn,
			String: '',
			Number: 1,
			Date: new Date(),
			fn: new Constructor(),
		};

		map(expectations, (value, expectation) =>
			expect(constructorName(value)).toEqual(expectation));

		[null, undefined].forEach((value) =>
			expect(constructorName(value)).toEqual(undefined));
	});

	test('inferType infers the type of the given value', () => {
		[
			[obj, 'object'],
			[arr, 'array'],
			[fn, 'function'],
			[new Date(), 'date'],
			[1, 'number'],
			[null, 'null'],
			[undefined, 'undefined'],
		].map(([value, type]) => expect(inferType(value)).toEqual(type));
	});

	test('isCollection is an alias for isIterable', () => {
		expect(isCollection).toEqual(isIterable);
	});

	test('isIterable returns true only when the given value'
		+ ' is an Array or an Object', () => {
		expect(isIterable(obj)).toEqual(true);
		expect(isIterable(arr)).toEqual(true);
		expect(isIterable(fn)).toEqual(false);
	});

	test('isFunction returns true only when the given value'
		+ ' is a Function', () => {
		expect(isFunction(obj)).toEqual(false);
		expect(isFunction(fn)).toEqual(true);
	});

	test('isDict returns true only when the given value'
	+ ' is an Object', () => {
		expect(isDict(obj)).toEqual(true);
		expect(isDict(arr)).toEqual(false);
	});

	test('isObject returns true only when the given value'
	+ ' is an Objectish', () => {
		expect(isObject(obj)).toEqual(true);
		expect(isObject(new Constructor())).toEqual(true);
		expect(isObject(arr)).toEqual(false);
	});

	test('isDefined returns false only when the given value'
		+ ' is undefined', () => {
		expect(isDefined(undefined)).toEqual(false);
		expect(isDefined(obj)).toEqual(true);
	});
});
