import { peek, sleep } from './debug';

beforeEach(() => {
	jest.clearAllMocks();
});

test('peek logs a value to the console and returns the same value.', () => {
	console.log = jest.fn(); // eslint-disable-line no-console

	const val = 1;

	const ret = peek(1);

	expect(ret).toBe(val);
	expect(console.log).toHaveBeenCalledWith(val); // eslint-disable-line no-console
});

test('sleep stalls the flow for 1000ms by default.', async () => {
	const startedAt = performance.now();

	await sleep();

	const resumedAt = performance.now();

	expect(resumedAt - startedAt >= 1000).toBe(true);
	expect(resumedAt - startedAt < 1010).toBe(true);
});
