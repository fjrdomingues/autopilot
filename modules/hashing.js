const crypto = require('crypto');

/**
 * Calculates a hash value for the specified file content.
 * @param {string} fileContent - The content of the file to calculate a hash value for.
 * @returns {string} - The hash value for the specified file content.
*/
function hashFile(fileContent){
    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    return hash;
}

module.exports = hashFile;