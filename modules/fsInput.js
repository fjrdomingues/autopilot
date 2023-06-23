const fs = require('fs');
const path = require('path');
const hashFile = require('./hashing');
const { countTokens } = require('./tokenHelper');


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
	const ignoreList = process.env.IGNORE_LIST.split(',');
	const fileExtensionsToProcess = process.env.FILE_EXTENSIONS_TO_PROCESS.split(',');

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
 * @param {string} filePathFull - The path of the file.
 * @param {string} fileContent - The content of the file.
 * @returns {object} - An object with the following properties:
	* filePath: The relative path of the file.
	* fileContent: The content of the file.
	* fileTokensCount: The count of tokens in the file.
	* fileHash: The hash of the file content.
    * fileTimestamp: The timestamp when the file was last modified.
 */
function parseFileContent(dir, filePathFull, fileContent) {
	const fileTokensCount = countTokens(fileContent);
	const fileHash = hashFile(fileContent);
	const relativePath = path.relative(dir, filePathFull).replace(/\\/g, '/');
	const fileTimestamp = fs.statSync(filePathFull).mtimeMs; // Get the file modification timestamp
	// TODO: cleanup file pre-fix from fields (need to match uses in other files)
	const parseFile = {
		filePath: relativePath,
		fileContent: fileContent,
		fileTokensCount: fileTokensCount,
		fileHash: fileHash,
		fileTimestamp: fileTimestamp,
	};
	return parseFile;
}

/**
 * Loads and hashes all project files in the specified directory.
 * @param {string} dir - The directory to load and hash project files from.
 * @returns {Array<{
	* filePath: string, // The relative path of the file.
	* fileContent: string, // The content of the file.
	* fileTokensCount: number, // The count of tokens in the file.
	* fileHash: string, // The hash of the file content.
	* fileTimestamp: string // The timestamp when the file was last modified.
 * }>} - An array of objects containing file details retrieved from the database.
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


/**
 * Takes an array of file objects, each with a path property, and returns an array of file objects,
 * each with a path property and a code property containing the file's contents.
 * @param {FileObject[]} files - An array of file objects, each with a path property.
 * @returns {FileObject[]} - An array of file objects,
 * each with a path property and a code property containing the file's contents.
 */
function getFiles(codeBaseDirectory, files){
	let retFiles=[]
	for (const file of files) {
	  const filePathRelative = file.path;
	  const filePathFull = path.posix.join(codeBaseDirectory, filePathRelative); 
		let fileContent
		if (file.exists) {
			fileContent = fs.readFileSync(filePathFull, 'utf8');
		} else {
			fileContent = "// This is a new file"
		}
	  file.code = fileContent
	  retFiles.push(file)
	}
	return retFiles
}

module.exports = {
	loadFiles,
	parseFileContent,
	getFiles,
}

