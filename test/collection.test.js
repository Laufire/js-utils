/* Tested */
const { result } = require('../src/collection');

describe('Collections', () => {

	test('result should work for esacped paths', () => {

		const obj = {
			single: 'single',
			parent: {
				child: 'child',
				'escaped/child': 'escaped/child',
				'unescaped\\/child': 'unescaped\\/child',
			}
		};

		expect(result(obj, 'parent/escaped\\/child')).toEqual('escaped/child')
		expect(result(obj, 'parent/unescaped\\\\\\/child')).toEqual('unescaped\\/child')
	});
});
