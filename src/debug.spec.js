import { peek, pretty, sleep } from './debug';

beforeEach(() => {
	jest.clearAllMocks();
});

describe('peek - a drop in console.log replacement with better devEx', () => {
	// eslint-disable-next-line no-console
	console.log = jest.fn();

	test('peek logs a value to the console and returns the same value.', () => {
		const val = 1;

		const ret = peek(val);

		expect(ret).toBe(val);
		// eslint-disable-next-line no-console
		expect(console.log).toHaveBeenCalledWith(val);
	});

	test('peek supports an optional label.', () => {
		const val = 1;
		const label = 'someLabel';

		peek(val, label);

		// eslint-disable-next-line no-console
		expect(console.log).toHaveBeenCalledWith(label, val);
	});
});

describe('pretty - returns the pretty JSON of the given value', () => {
	JSON.stringify = jest.fn();

	test('pretty calls the stringify with the given value and indent', () => {
		const value = Symbol('value');
		const indent = '    ';

		pretty(value, indent);

		expect(JSON.stringify).toHaveBeenCalledWith(
			value, null, indent
		);
	});

	test('indent defaults to tab', () => {
		const value = Symbol('value');

		pretty(value);

		expect(JSON.stringify).toHaveBeenCalledWith(
			value, null, '\t'
		);
	});
});

test('sleep stalls the flow for 1000ms by default.', async () => {
	// eslint-disable-next-line no-undef
	const startedAt = performance.now();

	await sleep();

	// eslint-disable-next-line no-undef
	const resumedAt = performance.now();

	expect(resumedAt - startedAt >= 1000).toBe(true);
	expect(resumedAt - startedAt < 1100).toBe(true);
});
