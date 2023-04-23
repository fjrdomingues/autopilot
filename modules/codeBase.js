const { loadFiles } = require('./fsInput');
const { generateAndWriteFileSummary } = require('./summaries');
const { calculateTokensCost } = require('./gpt');
const chalk = require('chalk');

/**
 * @description This function compares the files in a given codebase directory with the files in a database.
 * It identifies files that exist in the database but not on the filesystem, files that exist on the filesystem but not in the database, and files that have been modified on both the filesystem and in the database.
 * @param {string} codeBaseDirectory - The directory path of the codebase to be indexed.
 * @returns {Promise<{
* filesToDelete: Array<{
  * path: string, // The path of the file to be deleted from the database.
  * timestamp: string, // The timestamp of the file when it was last modified in the database.
  * hash: string // The hash of the file content in the database.
  * }>,
  * filesToIndex: Array<{
  * filePath: string, // The path of the file on the filesystem.
  * fileTimestamp: string, // The timestamp of the file when it was last modified on the filesystem.
  * fileContent: string // The content of the file on the filesystem.
  * }>,
  * filesToReindex: Array<{
  * filePath: string, // The path of the file on the filesystem.
  * fileTimestamp: string, // The timestamp of the file when it was last modified on the filesystem.
  * fileContent: string, // The content of the file on the filesystem.
  * dbTimestamp: string, // The timestamp of the file when it was last modified in the database.
  * dbHash: string // The hash of the file content in the database.
  * }>
  * }>} - A Promise that resolves to an object containing the following arrays:
 * filesToDelete: an array of objects representing the files that exist in the database but not on the filesystem.
 * filesToIndex: an array of objects representing the files that exist on the filesystem but not in the database.
 * filesToReindex: an array of objects representing the files that have been modified on both the filesystem and in the database.
*/
async function codeBaseGapFill(codeBaseDirectory){
  const { getDBFiles } = require('./db');
  const dbFiles = await getDBFiles(codeBaseDirectory);
  const fsFiles = loadFiles(codeBaseDirectory);

  // Find files that exist in the DB but not on the filesystem
  const filesToDelete = dbFiles.filter(dbFile =>
    !fsFiles.find(fsFile => fsFile.filePath === dbFile.path)
  );

  // Find files that exist on the filesystem but not in the DB
  const filesToIndex = fsFiles.filter(fsFile =>
    !dbFiles.find(dbFile => dbFile.path === fsFile.filePath)
  );

  // Find files that have been modified on both the filesystem and in the DB
  const filesToReindex = fsFiles.filter(fsFile => {
    const dbFile = dbFiles.find(dbFile => dbFile.path === fsFile.filePath);
    return dbFile && dbFile.hash !== fsFile.fileHash;
  });

  return {
    filesToDelete,
    filesToIndex,
    filesToReindex,
  };
}

/**
 * Calculates the cost of a project by summing the cost of all files in the specified directory.
 * @param {string} codeBaseDirectory - The directory to calculate the project cost for.
 * @param {string} model - The model to use for the cost calculation.
 * @returns {number} - The cost of the project in tokens.
 */
async function codeBaseFullIndex(codeBaseDirectory, model){
    const files = loadFiles(codeBaseDirectory);
  
    for (const file of files) {
      const fileContent = file.fileContent;
      const filePathRelative = file.filePath;
  
      await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent, model);
    }
};


/**
 * 
 * Calculates and displays the estimated size and cost of a project based on the number of tokens in a given directory path.
 * @param {string} directoryPath - The path to the directory containing the project files.
 * @param {object} model - The cost model to use for calculating the cost.
 */
function printCostEstimation(directoryPath, model){
  const getDirectoryTokensCount = require('./directoryHelper');
  tokenCount = getDirectoryTokensCount(directoryPath)
  cost = calculateTokensCost(model, tokenCount, null, tokenCount)
  
  console.log(`Project size: ~${tokenCount} tokens, estimated cost: $${chalk.yellow(cost.toFixed(4))}`);
}

/**
 * Asks the user for approval to proceed with summarizing the project.
 * @returns {boolean} - Whether the user has approved the indexing.
 */
async function approveIndexing(){
  const prompts = require('prompts');

  const proceed = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Proceed with summarizing the project?',
  });
  return proceed.value;
}

/**
 * Indexes the full codebase interactively.
 * @param {string} codeBaseDirectory - The directory of the codebase to be indexed.
 * @param {object} model - The model used for indexing.
 * @returns {Promise<void>}
 */
async function codeBaseFullIndexInteractive(codeBaseDirectory, model){
    printCostEstimation(codeBaseDirectory, model);

    if (await approveIndexing()) {
        await codeBaseFullIndex(codeBaseDirectory, model);
    } else {
        console.log('Aborted summarizing the project.');
    }
}


module.exports = { codeBaseFullIndex, codeBaseFullIndexInteractive, codeBaseGapFill }