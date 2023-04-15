const fs = require('fs');
const path = require('path');
require('dotenv').config();
const hashFile = require('./hashing');
const countTokens = require('./tokenHelper');

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
 * Parses the file content and returns an object with relevant file information.
 * @param {string} dir - The directory path of the file.
 * @param {string} filePath - The path of the file.
 * @param {string} fileContent - The content of the file.
 * @returns {object} - An object with the following properties:
	* filePath: The relative path of the file.
	* fileContent: The content of the file.
	* fileTokensCount: The count of tokens in the file.
	* fileHash: The hash of the file content.
 */
function parseFileContent(dir, filePath, fileContent) {
	const fileTokensCount = countTokens(fileContent);
	const fileHash = hashFile(fileContent);
	const relativePath = path.posix.relative(dir, filePath);
	const file = {
		filePath: relativePath,
		fileContent: fileContent,
		fileTokensCount: fileTokensCount,
		fileHash: fileHash
	};
	return file;
}

/**
 * Loads and hashes all project files in the specified directory.
 * @param {string} dir - The directory to load and hash project files from.
 * @returns {object[]} An array of objects containing the file path, file content, file token count, and file hash.
 */
function loadFiles(dir) {

    const filePaths = getFilePaths(dir);
    const files = [];
  
    for (const filePath of filePaths) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (!fileContent || fileContent.length == 0) {
            continue;
        }
        const file = parseFileContent(dir, filePath, fileContent);
        files.push(file);
    }
  
    return files;
};

module.exports = loadFiles;

