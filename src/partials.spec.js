import { partial, translate } from './partials';

test('translate returns a partial to access values of collections', () => {
	const map = { a: 1 };
	const translator = translate(map);

	expect(translator('a')).toEqual(1);
});

describe('partial returns a partially provisioned function, '
+ 'which could be called with remaining data.', () => {

	test('arrays are used for positional arguments', () => {
		const sum = (a, b) => a + b;
		const withoutB = partial(sum, [1]);
		const withoutA = partial(sum, [undefined, 2]);

		expect(withoutB(3)).toEqual(4);
		expect(withoutA(1)).toEqual(3);
	});

	test('objects are used for named arguments', () => {
		const sum = ({ a, b }) => a + b;
		const simple = partial(sum, { a: 1 });
		const overridden = partial(sum, { a: 2 });

		expect(simple({ b: 2 })).toEqual(3);
		expect(overridden({ a: 1, b: 2 })).toEqual(3);
	});

});
