const fs = require('fs');
const path = require('path');

const ignoreList = process.env.IGNORE_LIST.split(',');
const fileExtensionsToProcess = process.env.FILE_EXTENSIONS_TO_PROCESS.split(',');

/**
 * Recursively scans the directory specified by 'dir', searching for project files.
 * Project files are identified based on their file extension (defined in 'fileExtensionsToProcess').
 * If a subdirectory is encountered, it will be recursively searched unless it's in the 'ignoreList'.
 * @param {string} dir - The path of the directory to scan for project files.
 * @param {string[]} ignoreList - An array of directory names to ignore.
 * @param {string[]} fileExtensionsToProcess - An array of file extensions to search for.
 * @returns {string[]} An array of absolute file paths for all project files found.
*/
function getFilePaths(dir) {
  const files = fs.readdirSync(dir);
  const projectFiles = [];

  for (const file of files) {
    const filePath = path.posix.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && !ignoreList.includes(file)) {
      projectFiles.push(...getFilePaths(filePath));
    } else if (fileExtensionsToProcess.includes(path.extname(filePath))) {
      projectFiles.push(filePath);
    }
  }

  return projectFiles;
};


/**
 * Loads and hashes all project files in the specified directory.
 * @param {string} dir - The directory to load and hash project files from.
 * @returns {object[]} An array of objects containing the file path, file content, file token count, and file hash.
 */
function loadFiles(dir) {
    require('dotenv').config();
    const hashFile = require('./hashing');
    const countTokens = require('./tokenHelper');

    const filePaths = getFilePaths(dir);
    const files = [];
  
    for (const filePath of filePaths) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (!fileContent || fileContent.length == 0) {
            continue;
        }
        const fileTokensCount = countTokens(fileContent);
        const fileHash = hashFile(fileContent);
        const relativePath = path.posix.relative(dir, filePath);

        files.push({
            filePath: relativePath,
            fileContent: fileContent,
            fileTokensCount: fileTokensCount,
            fileHash: fileHash
        });
    }
  
    return files;
};

module.exports = loadFiles;