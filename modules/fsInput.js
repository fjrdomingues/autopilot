const fs = require('fs');
const path = require('path');

const ignoreList = process.env.IGNORE_LIST.split(',');
const fileExtensionsToProcess = process.env.FILE_EXTENSIONS_TO_PROCESS.split(',');

/**
 * Recursively scans the directory specified by 'dir', searching for project files.
 * Project files are identified based on their file extension (defined in 'fileExtensionsToProcess').
 * If a subdirectory is encountered, it will be recursively searched unless it's in the 'ignoreList'.
 * @param {string} dir - The path of the directory to scan for project files.
 * @returns {string[]} An array of absolute file paths for all project files found.
*/
const fileProjectFiles = (dir) => {
  const files = fs.readdirSync(dir);
  const projectFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && !ignoreList.includes(file)) {
      projectFiles.push(...fileProjectFiles(filePath));
    } else if (fileExtensionsToProcess.includes(path.extname(filePath))) {
      projectFiles.push(filePath);
    }
  }

  return projectFiles;
};

module.exports = fileProjectFiles;