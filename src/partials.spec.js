/* Helpers */
import { rndString } from '@laufire/utils/random';
import { rndNumber } from '../test/helpers';

/* Tested */
import { partial, translate } from './partials';

test('translate returns a partial to access values of collections', () => {
	const key = rndString();
	const number = rndNumber();
	const map = { [key]: number };
	const translator = translate(map);

	expect(translator(key)).toEqual(number);
});

describe('partial returns a partially provisioned function, '
+ 'which could be called with remaining data.', () => {
	const numOne = rndNumber();
	const numTwo = rndNumber();
	const numThree = rndNumber();
	const numFour = rndNumber();

	test('arrays are used for positional arguments', () => {
		const sum = (a, b) => a + b;
		const withoutBValue = partial(sum, [numOne]);
		const withoutAValue = partial(sum, [undefined, numThree]);

		expect(withoutBValue(numTwo)).toEqual(numOne + numTwo);
		expect(withoutAValue(numFour)).toEqual(numThree + numFour);
	});

	test('objects are used for named arguments', () => {
		const sum = ({ a, b }) => a + b;
		const simple = partial(sum, { a: numOne });
		const overridden = partial(sum, { a: numOne - rndNumber() });

		expect(simple({ b: numTwo })).toEqual(numOne + numTwo);
		expect(overridden({ a: numThree, b: numFour }))
			.toEqual(numThree + numFour);
	});
});
