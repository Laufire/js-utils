import { tag } from './parser';

describe('Tag each item in the collection with relevant attributes', () => {
	const tags = {
		human: {
			power: 'None',
			origin: 'Evolution',
		},
		superhuman: {
			power: 'Extraordinary abilities',
			origin: ['Accidents, experiments'],
		},
		mutant: {
			power: 'Super abilities',
			origin: 'Genetic mutations',
		},
	};

	test('Example for tag', () => {
		const collection = [
			{
				tags: ['human'],
				name: 'Tony Stark',
				team: 'Avengers',
			},
		];

		const expected = [
			{
				tags: ['human'],
				name: 'Tony Stark',
				team: 'Avengers',
				power: 'None',
				origin: 'Evolution',
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});

	test('The collections attribute takes precedence over the tags item.', () => {
		const collection = [
			{
				tags: ['human'],
				name: 'Tony Stark',
				power: 'Powered Armor',
			},
		];

		const expected = [
			{
				tags: ['human'],
				name: 'Tony Stark',
				origin: 'Evolution',
				power: 'Powered Armor',
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});

	test('Tags has ascending priority', () => {
		const collection = [
			{
				tags: ['human', 'superhuman'],
				name: 'Steve Rogers',
				team: 'Avengers',
			},
		];

		const expected = [
			{
				tags: ['human', 'superhuman'],
				name: 'Steve Rogers',
				team: 'Avengers',
				power: 'Extraordinary abilities',
				origin: ['Accidents, experiments'],
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});

	test('Unknown tags have no effect', () => {
		const collection = [
			{
				tags: ['alien'],
				name: 'Groot',
				team: 'Guardians of the Galaxy',
			},
		];

		const expected = [
			{
				tags: ['alien'],
				name: 'Groot',
				team: 'Guardians of the Galaxy',
			},
		];

		const result = tag(collection, tags);

		expect(result).toEqual(expected);
	});
});
