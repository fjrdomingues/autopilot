const autopilotDirectoryName = '.autopilot';
const path = require('path');
const { loadFiles } = require('./files');
const generateAndWriteFileSummary = require('./summaries').generateAndWriteFileSummary;
const { calculateTokensCost } = require('./gpt');


function getCodeBaseAutopilotDirectory(codeBaseDirectory){
    return path.posix.join(codeBaseDirectory, autopilotDirectoryName);
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


// Calculate and display the project size and cost estimation
function printCostEstimation(directoryPath, model){
    const getDirectoryTokensCount = require('./modules/directoryHelper');
    tokenCount = getDirectoryTokensCount(directoryPath)
    cost = calculateTokensCost(model, tokenCount, null, tokenCount)
    
    console.log(`Project size: ~${tokenCount} tokens, estimated cost: $${chalk.yellow(cost.toFixed(4))}`);
  }
  
  async function approveIndexing(){
    const prompts = require('prompts');
  
    const proceed = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'Proceed with summarizing the project?',
    });
    return proceed.value;
  }
  
async function codeBaseFullIndexInteractive(codeBaseDirectory, model){
    printCostEstimation(codeBaseDirectory, model);

    if (await approveIndexing()) {
        await codeBaseFullIndex(codeBaseDirectory, model);
    } else {
        console.log('Aborted summarizing the project.');
    }
}


module.exports = { getCodeBaseAutopilotDirectory, codeBaseFullIndex, codeBaseFullIndexInteractive }