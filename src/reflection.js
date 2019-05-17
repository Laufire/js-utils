/**
 * Reflection
 */

const getConstructorName = (value) =>
	value !== null && value !== undefined && value.constructor && value.constructor.name;

module.exports = {
	getConstructorName,
}
