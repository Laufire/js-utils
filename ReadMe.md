# Laufire - JS Utils

  A simple set of utility libraries to ease development.

## Notes

* The reason for writing custom functions instead of depending on libraries is that, there isn't a coherent set. Depending on many libraries increases the time to learn their APIs.

* The differences between some functions:
	* merge - replaces array elements, thus does not allow resulting array to have fewer elements.
	* overlay - uses extension arrays, as they are, allowing for greater control.
	* combine - adds the extension arrays to the source arrays, thus makes array lengths the sum of the two.

## HowTo

* When immutability is required for functions like collection.merge and collection.combine, pass an empty base object. Ex: *merge({}, someObj)*

## ToDo

* Maintain key order in the results.

* Move to Typescript, to allow for better support on IDEs.
