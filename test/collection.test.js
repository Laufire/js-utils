/* Tested */
const { clean, result } = require('../src/collection');

describe('Collections', () => {

	/* Mocks and Stubs */
	const testObj = {
		single: 'single',
		parent: {
			child: 'child',
			'escaped/child': 'escaped/child',
			'unescaped\\/child': 'unescaped\\/child',
		},
		undeifinedProp: undefined,
	};

	/* Tests */
	test('result should work for esacped paths', () => {

		expect(result(testObj, 'parent/escaped\\/child')).toEqual('escaped/child')
		expect(result(testObj, 'parent/unescaped\\\\\\/child')).toEqual('unescaped\\/child')
	});

	test('clean should remove undefined props', () => {
		expect(clean(testObj)).not.toHaveProperty('undefinedProperty');
	});
});
