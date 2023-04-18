const { get_encoding } = require('@dqbd/tiktoken');

/**
* Counts the number of tokens in the input string.
* @param {string} input - The input string to tokenize.
* @returns {number} - The number of tokens in the input string.
*/
function countTokens(input) {
	const encoder = get_encoding("cl100k_base")
	const tokens = encoder.encode(input);
	const tokenCount = tokens.length;
	encoder.free();
	return tokenCount;
}

module.exports = {countTokens};