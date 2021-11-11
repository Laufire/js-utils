import {
	map, range, fromEntries,
	values, secure,
} from '@laufire/utils/collection';
import { rndValue, rndBetween, rndString } from '@laufire/utils/random';

/* Tested */
import {
	constructorName,
	inferType,
	isCollection,
	isIterable,
	isFunction,
	isDict,
	isObject,
	isDefined,
	isEmpty,
	isSimple,
} from './reflection';

describe('Reflection', () => {
	/* Mocks and Stubs */
	const arr = secure(range(0, rndBetween(5, 8)));
	const obj = secure(fromEntries(map(arr, (value, index) => [index, value])));
	const fn = function () {};
	const Constructor = fn;
	const constructed = new Constructor();
	const emptyTypes = secure({
		null: null,
		undefined: undefined,
		number: NaN,
	});
	const simpleTypes = secure({
		number: rndBetween(0, 9),
		string: rndString(16),
		boolean: rndValue([true, false]),
	});
	const iterableTypes = secure({
		array: arr,
		object: obj,
		map: new Map(),
	});
	const constructedTypes = secure({
		date: new Date(),
		map: new Map(),
		object: constructed,
	});
	const complexTypes = secure({
		...iterableTypes,
		...constructedTypes,
		function: fn,
	});
	const allTypes = secure({
		...emptyTypes,
		...simpleTypes,
		...complexTypes,
	});

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
			fn: constructed,
		};

		map(expectations, (value, expectation) =>
			expect(constructorName(value)).toEqual(expectation));

		[null, undefined].forEach((value) =>
			expect(constructorName(value)).toEqual(undefined));
	});

	test('inferType infers the type of the given value', () => {
		const expectations = allTypes;

		map(expectations, (value, type) =>
			expect(inferType(value)).toEqual(type));
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
		expect(isObject(constructed)).toEqual(true);
		expect(isObject(arr)).toEqual(false);
	});

	test('isDefined returns false only when the given value'
		+ ' is undefined', () => {
		expect(isDefined(undefined)).toEqual(false);
		expect(isDefined(obj)).toEqual(true);
	});

	test('isEmpty', () => {
		const emptyValues = values(emptyTypes);

		map(allTypes, (value) =>
			expect(isEmpty(value)).toEqual(emptyValues.includes(value)));
	});

	test('isSimple', () => {
		const simpleValues = values(simpleTypes);

		map(allTypes, (value) =>
			expect(isSimple(value)).toEqual(simpleValues.includes(value)));
		expect(isSimple(NaN)).toEqual(false);
	});
});
