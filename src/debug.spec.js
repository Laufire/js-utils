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

// TODO: Mock the test instead of testing the implementation, in order to save time.
// TODO: Spyon global setTimeout and Promise for parameters.
test('sleep stalls the flow for 1000ms by default.', async () => {
	// eslint-disable-next-line no-undef
	const startedAt = performance.now();

	await sleep();

	// eslint-disable-next-line no-undef
	const resumedAt = performance.now();

	expect(resumedAt - startedAt >= 1000).toBe(true);
	expect(resumedAt - startedAt < 1100).toBe(true);
});
