# Change Log

## v3

### Breaking Changes

* collection

  * Array keys are not strings anymore. They are now numbers to ensure compatibility.

	* Rename is removed, as translate could achieve the same effect.

	* Final spread parameters of methods like gather are now arrays.

	* Walk now could process the summary from the children of every iterable, when processing the iterable.

	*

* random

	* rndBetween - The second argument has become exclusive, in order to allow for better devEx and to be inline with other methods like collection.range.

* crunch

	* index - Leaf elements are now arrays, instead of values to allow for multiple matches.

	* Final spread parameters of methods like summarize are now arrays.

### Introductions

* path - a module help with processing path strings for traversing nested collections.

* prob - a module to help with solving probability related problems.

* number - a module to help with dealing with numbers.

* matchers - a module to help with value matching in tests.

* crunch

	* transpose - transposes the first two dimensions of a nested iterable.

* collection

	* nReduce - Helps with reducing nested objects.

## Extensions

* Introduced rndBetween.precision to ease the generation of floats.

### Dev Notes

* Started using published version of the library to ease testing.

* Almost all the tests were randomized to make the functions robust.
