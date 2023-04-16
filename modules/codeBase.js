const { loadFiles } = require('./fsInput');
const { generateAndWriteFileSummary } = require('./summaries');
const { calculateTokensCost } = require('./gpt');
const chalk = require('chalk');

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


module.exports = { codeBaseFullIndex, codeBaseFullIndexInteractive }