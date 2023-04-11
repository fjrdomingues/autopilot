/**
 * A function that parses a JSON string and validates its syntax.
 *
 * @param {string} json - The JSON string to be parsed.
 * @returns {object} - The parsed JSON object.
 * @throws {Error} - If the JSON string is invalid.
 */
function jsonParseWithValidate(json) {
    try {
        return JSON.parse(json);
    } catch (error) {
        console.log('failed to parse JSON',error,json)
        throw new Error('Invalid JSON');
    }
}
  
module.exports = { jsonParseWithValidate }