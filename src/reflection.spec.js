/* Helpers */
import { map, values } from '@laufire/utils/collection';
import {
	array, object, expectEquals,
	simpleTypes, allTypes, emptyTypes,
}	from '../test/helpers';

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
	// TODO: Move all possible values to test helpers.
	const fn = function () {};
	const Constructor = fn;
	const constructed = new Constructor();

	/* Tests */
	test('constructorName returns the constructor name'
	+ ' of the given value', () => {
		const expectations = {
			Object: object,
			Array: array,
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
		const expectations = allTypes();

		map(expectations, (value, type) =>
			expect(inferType(value)).toEqual(type));
	});

	test('isCollection is an alias for isIterable', () => {
		expect(isCollection).toEqual(isIterable);
	});

	test('isIterable returns true only when the given value'
		+ ' is an Array or an Object', () => {
		expect(isIterable(object)).toEqual(true);
		expect(isIterable(array)).toEqual(true);
		expect(isIterable(fn)).toEqual(false);
	});

	test('isFunction returns true only when the given value'
		+ ' is a Function', () => {
		expect(isFunction(object)).toEqual(false);
		expect(isFunction(fn)).toEqual(true);
	});

	test('isDict returns true only when the given value'
	+ ' is an Object', () => {
		expect(isDict(object)).toEqual(true);
		expect(isDict(array)).toEqual(false);
	});

	test('isObject returns true only when the given value'
	+ ' is an Objectish', () => {
		expect(isObject(object)).toEqual(true);
		expect(isObject(constructed)).toEqual(true);
		expect(isObject(array)).toEqual(false);
	});

	test('isDefined returns false only when the given value'
		+ ' is undefined', () => {
		map(allTypes(), (value) => {
			expectEquals(isDefined(value), value !== undefined);
		});
	});

	test('isEmpty', () => {
		const emptyValues = values(emptyTypes());

		map(allTypes(), (value) =>
			expect(isEmpty(value)).toEqual(emptyValues.includes(value)));
	});

	test('isSimple', () => {
		const simpleValues = simpleTypes();
		const collection = { ...allTypes(), ...simpleValues };

		map(collection, (value) =>
			expect(isSimple(value))
				.toEqual(values(simpleValues).includes(value)));
		expect(isSimple(NaN)).toEqual(false);
	});
});
