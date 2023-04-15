const loadFiles = require('./fsInput');

/**
 * Calculates the total size of a directory by summing the length of all files in the directory.
 * @param {string} dir - The directory path to calculate the size of.
 * @returns {number} - The total size of the directory in bytes.
 */
const getDirectorySize = (dir) => {
  let directorySize = 0;

  const files = loadFiles(dir);
  for (const file of files) {
    const fileContent = file.fileContent;
    directorySize += fileContent.length;
  }

  return directorySize;
};

exports.getDirectorySize = getDirectorySize;
