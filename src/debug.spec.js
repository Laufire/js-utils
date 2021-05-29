import { peek, sleep } from './debug';

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

		const ret = peek(val, label);

		// eslint-disable-next-line no-console
		expect(console.log).toHaveBeenCalledWith(label, val);
	});
});

test('sleep stalls the flow for 1000ms by default.', async () => {
	const startedAt = performance.now();

	await sleep();

	const resumedAt = performance.now();

	expect(resumedAt - startedAt >= 1000).toBe(true);
	expect(resumedAt - startedAt < 1100).toBe(true);
});
