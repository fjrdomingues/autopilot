const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const { calculateTokensCost } = require('./modules/gpt');
const countTokens = require('./modules/tokenHelper');
const loadFiles = require('./modules/fsInput');
const { getDirectorySize } = require("./modules/directoryHelper");

require('dotenv').config();

const maxTokenSingleFile = 3000;

/**
 * Calculates the cost of a project by summing the cost of all files in the specified directory.
 * @param {string} dir - The directory to calculate the project cost for.
 * @param {string} model - The model to use for the cost calculation.
 * @returns {number} - The cost of the project in tokens.
 */
const processDirectory = async (dir, model) => {
  const files = loadFiles(dir);

  for (const file of files) {
    const fileContent = file.fileContent;
    const fileTokensCount = file.fileTokensCount;
    const filePathRelative = file.filePath;

    console.log(filePathRelative, fileTokensCount);
    if (fileTokensCount > maxTokenSingleFile) {
      console.log(chalk.red('File too BIG'));
      continue;
    }
    if (fileTokensCount == 0) {
      console.log(chalk.yellow('Empty file'));
      continue;
    }

    await processFile(dir, filePathRelative, fileContent, model);
  }
};

/**
 * Processes a file by generating a summary using the specified machine learning model
 * and writing the summary to a new file.
 * @param {string} dir - The directory of the file being processed.
 * @param {string} filePathRelative - The relative path of the file being processed.
 * @param {string} fileContent - The content of the file being processed.
 * @param {object} model - The machine learning model used to generate the summary.
 */
async function processFile(dir, filePathRelative, fileContent, model) {
  const fileSummary = require('./agents/indexer')

  try {
    const output = await fileSummary(fileContent,model)

    if (output) {
        const filePathFull = path.join(dir, filePathRelative);
        const summaryFilePath = path.join(filePathFull + '.ai.txt');
        const summaryFileContent = `File Path: ${filePathRelative}\nSummary:\n${output}`
        fs.writeFileSync(summaryFilePath, summaryFileContent);
        const timestamp = new Date().toISOString();
        const hour = timestamp.match(/\d\d:\d\d/);

        console.log(`${hour}: Updated ${summaryFilePath}`);
    }
  } catch (error) {
    console.error(`Error processing file: ${filePathRelative}`, error);
  }
};

// Prompt the user to proceed
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function getOptions(){
  const yargs = require('yargs');
  const options = yargs
  .option('dir', {
    alias: 'd',
    describe: 'The path to the directory containing the code files',
    default: process.env.CODE_DIR,
    type: 'string'
  })
  .option('all', {
    describe: 'Whether to perform a full analysis of all code files',
    default: false,
    type: 'boolean'
  })
  .option('model', {
    alias: 'm',
    describe: 'The name of the model to generate the analysis summary',
    default: process.env.SUMMARY_MODEL,
    type: 'string'
  })
  .option('auto', {
    alias: 'a',
    describe: 'Run --all without prompts',
    default: false,
    type: 'boolean'
  })
  .option('watch', {
    alias: 'w',
    describe: 'watch for file changes',
    default: true,
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .argv;

  return options;
}

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

async function indexFullProject(directoryPath, model){
  printCostEstimation(directoryPath, model);

  if (await approveIndexing()) {
    await processDirectory(directoryPath, model);
  } else {
    console.log('Aborted summarizing the project.');
  }
}

async function main(processAllFile, watchFileChanges) {
  const fileExtensionsToProcess = process.env.FILE_EXTENSIONS_TO_PROCESS.split(',');
  const chokidar = require('chokidar');

  const options = getOptions();
  const directoryPath = options.dir;
  const fullAnalysis = processAllFile || options.all;
  const model = options.model;
  const watchChanges = watchFileChanges || options.watch

  if (fullAnalysis) { await indexFullProject(directoryPath, model); }

  if(watchChanges) {
    // Watch for file changes in the directory
    const watcher = chokidar.watch(directoryPath, {
      ignored: /node_modules|helpers/,
      persistent: true,
      ignoreInitial: true,
    });
    // Process the modified file
    watcher.on('change', async (filePath) => {
      if (fileExtensionsToProcess.includes(path.extname(filePath))) {
        console.log(`File modified: ${filePath}`);
        await processFile(filePath, model);
      }
    });
    console.log('Watching for file changes...');
  }
}

if (require.main === module) main();

module.exports = { main }
