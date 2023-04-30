const chalk = require('chalk');

/**
 * Searches for gaps in the code base and fills them by deleting unnecessary files and indexing new or modified files.
 * @param {string} codeBaseDirectory - The directory path of the code base to gap fill.
 * @param {boolean} interactive - A flag indicating whether the function should prompt the user for approval before performing the gap fill.
 * @returns {Promise<void>} - A promise that resolves when the gap fill is complete.
 */
async function indexGapFill(codeBaseDirectory, interactive) {
  const { codeBaseGapFill } = require('./codeBase');
  const ret = await codeBaseGapFill(codeBaseDirectory);
  const filesToDelete = ret.filesToDelete;
  const filesToIndex = ret.filesToIndex.concat(ret.filesToReindex);
  const numberOfGaps = filesToDelete.length + filesToIndex.length;
  if (numberOfGaps > 0) {
    if (!interactive) {
      console.log(chalk.green(`Gap fill: ${numberOfGaps} gaps found, fixing...`));
      await gapFill(filesToDelete, codeBaseDirectory, filesToIndex);
    } else {
      tokenCount = countTokensOfFilesToIndex(filesToIndex);
      const { calculateTokensCost } = require('./gpt');
      cost = calculateTokensCost(process.env.INDEXER_MODEL, tokenCount, null, tokenCount);

      console.log(chalk.yellow(`Gap fill: ${numberOfGaps} gaps found, estimated cost: $${chalk.yellow(cost.toFixed(4))}`));
      if (await approveGapFill()) {
        await gapFill(filesToDelete, codeBaseDirectory, filesToIndex);
      }
    }
  }
}

/**
 * Counts the number of tokens in the given array of files.
 * @param {Array} filesToIndex - An array of objects representing files to index.
 * @param {string} filesToIndex[].fileName - The name of the file.
 * @param {string} filesToIndex[].fileContent - The content of the file.
 * @returns {number} - The total number of tokens in all the files.
 */
function countTokensOfFilesToIndex(filesToIndex) {
  const { countTokens } = require('./tokenHelper');

  let reindex_content;
  for (const file of filesToIndex) {
    // TODO: for more accuracy need to add the agent prompt
    reindex_content += file.fileContent;
  }
  const tokenCount = countTokens(reindex_content);
  return tokenCount;
}

/**
 * @returns {Promise<boolean>} - A promise that resolves with a boolean value indicating whether to proceed with fixing the gap in summarizing.
 * @description Asks the user to confirm whether to proceed with fixing a gap in summarizing. Returns a boolean value indicating the user's response.
 */
async function approveGapFill(){
  const prompts = require('prompts');

  const proceed = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Proceed with fixing the gap in summarizing?',
  });
  return proceed.value;
}

/**
 * @param {Array<Object>} filesToDelete - An array of objects representing files to be deleted.
 * @param {string} filesToDelete[].path - The relative path to the file to be deleted.
 * @param {string} codeBaseDirectory - The root directory of the codebase.
 * @param {Array<Object>} filesToIndex - An array of objects representing files to be indexed.
 * @param {string} filesToIndex[].filePath - The relative path to the file to be indexed.
 * @returns {Promise<void>} - A promise that resolves when all files have been processed.
 * @description Deletes files specified in the filesToDelete array, and generates file summaries for files specified in the filesToIndex array. File summaries are written to the database. If a file is both in the filesToDelete and filesToIndex arrays, it will be deleted and then indexed.
 */
async function gapFill(filesToDelete, codeBaseDirectory, filesToIndex) {
  const fs = require('fs');
  const path = require('path');

  const { deleteFile } = require('./db');
  const { generateAndWriteFileSummary } = require('./summaries');

  for (const file of filesToDelete) {
    const filePathRelative = file.path;
    await deleteFile(codeBaseDirectory, filePathRelative);
  }
  for (const file of filesToIndex) {
    const filePathRelative = file.filePath;
    const filePathFull = path.posix.join(codeBaseDirectory, filePathRelative);
    const fileContent = fs.readFileSync(filePathFull, 'utf-8');
    await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent);
  }
}

module.exports = { indexGapFill };