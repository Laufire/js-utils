# Laufire - JS Utils

  A simple set of utility libraries to ease development.

## Notes

* The reason for writing custom functions instead of depending on libraries is that, there isn't a coherent set. Depending on many libraries increases the time to learn their APIs.

* The differences between some functions:
	* merge - replaces array elements, thus does not allow resulting array to have fewer elements.
	* overlay - uses extension arrays, as they are, allowing for greater control.
	* combine - adds the extension arrays to the source arrays, thus makes array lengths the sum of the two.

* Randomized tests are expected to have an accuracy above second standard deviation, to allow for faster testing cycles.

## HowTo

* When immutability is required for functions like collection.merge and collection.combine, pass an empty base object. Ex: *merge({}, someObj)*

## ToDo

* Consider passing nested paths to the callbacks of collection.traverse and collection.walk.

* Ensure key order in the results.

* Move to Typescript, to allow for better support on IDEs.

* Fix grammar.

* Improve API documentation.

* Test the index file for the integrity of imports.

* Coverage might not cover all paths. Especially those of shared functions, as they might be partially covered by multiple functions, yet report full coverage. Find a fix for this.

* Make randomized testing to achieve accuracy above third standard deviation, when publishing (to NPM). Use environment variables.

* Functionalities:

	* collection

		* set - a container agnostic function to set the given values to the given keys.

		* till / findResult - a findKey like function which returns the return value of the predicate instead.

* Pre-release

	* Audit the packages.

	* Update the packages.

	* Support at least the last four LTS vesrions of Node JS.

## Later

* Test for and improve performance.

* Rename the functions for readability, ease of recollection and to be semantic.

* Try avoiding duplicate names across modules.

* Try to build synthesis with al-js.

## Gotchas

* Object keys maintain a chronological order, unless they are integers. In which case they are added to the beginning in an ascending order.

## Decisions

* 20211111 - Decided to use numbers as array keys, to play nice with third party libraries.
