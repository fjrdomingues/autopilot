const loadFiles = require('./fsInput');

/**
 * Calculates the total size of a directory by summing the length of all files in the directory.
 * @param {string} dir - The directory path to calculate the size of.
 * @returns {number} - The total size of the directory in bytes.
 */
function getDirectoryTokensCount(dir) {
  let directoryTokensCount = 0;

  const files = loadFiles(dir);
  for (const file of files) {
    directoryTokensCount += file.fileTokensCount;
  }

  return directoryTokensCount;
};

module.exports = getDirectoryTokensCount;
