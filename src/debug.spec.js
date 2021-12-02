/* eslint-disable no-console */
import { peek, pretty, sleep } from './debug';

// TODO: Try to use package config instead.
beforeEach(() => {
	jest.clearAllMocks();
});

const value = Symbol('value');

describe('peek - a drop in console.log replacement with better devEx', () => {
	console.log = jest.fn();

	test('peek logs a value to the console and returns the same value.', () => {
		const ret = peek(value);

		expect(ret).toBe(value);
		expect(console.log).toHaveBeenCalledWith(value);
	});

	test('peek supports an optional label.', () => {
		const label = Symbol('someLabel');

		peek(value, label);

		expect(console.log).toHaveBeenCalledWith(label, value);
	});
});

describe('pretty - returns the pretty JSON of the given value', () => {
	JSON.stringify = jest.fn();

	test('pretty calls the stringify with the given value and indent', () => {
		const indent = Symbol('indent');

		pretty(value, indent);

		expect(JSON.stringify).toHaveBeenCalledWith(
			value, null, indent
		);
	});

	test('indent defaults to tab', () => {
		pretty(value);

		expect(JSON.stringify).toHaveBeenCalledWith(
			value, null, '\t'
		);
	});
});

test('sleep', () => {
	const resolve = Symbol('resolve');
	const ms = Symbol('ms');
	const defaultMS = 1000;
	const mockPromise = jest.fn().mockImplementation((cb) => cb(resolve));
	const mockSetTimeout = jest.fn()
		.mockImplementation((arg, sec) => ({ arg, sec }));

	jest.spyOn(global, 'Promise').mockImplementation(mockPromise);
	jest.spyOn(global, 'setTimeout').mockImplementation(mockSetTimeout);

	const expectations = [
		[ms, ms],
		[undefined, defaultMS],
	];

	expectations.map(([time, expectation]) => {
		sleep(time);

		expect(mockSetTimeout).toHaveBeenCalledWith(resolve, expectation);
	});
});
