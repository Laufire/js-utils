import { translate } from './partials';

test('translate returns a partial to access values of collections', () => {
	const map = { a: 1 };
	const translator = translate(map);

	expect(translator('a')).toEqual(1);
});
