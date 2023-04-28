// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.
const chalk = require('chalk');
const agents = require('./agents');
const yargs = require('yargs');
const prompts = require('prompts');
const fs = require('fs');
const path = require('path');

const { getTaskInput } = require('./modules/userInputs');
const { getSummaries, chunkSummaries, maxSummaryTokenCount } = require('./modules/summaries');
const { saveOutput, logPath, updateFile } = require('./modules/fsOutput');
const { printGitDiff } = require('./modules/gitHelper');
const { getFiles } = require('./modules/fsInput');
const { generateAndWriteFileSummary } = require('./modules/summaries');

const testingDirectory = '/benchmarks';

/**
@description Asynchronous function that runs an agent function with given variables.
@param {function} agentFunction - The agent function to be executed asynchronously.
@param {any} var1 - The first variable to be passed as an argument to the agent function.
@param {any} var2 - The second variable to be passed as an argument to the agent function.
@param {boolean} interactive=false - A boolean indicating whether or not to prompt the user for approval after running the agent function.
@returns {Promise<any>} A Promise that resolves with the return value of the agent function if not in interactive mode, otherwise resolves or rejects based on user input.
*/
async function runAgent(agentFunction, var1, var2, interactive=false){
  console.log("(agent)", agentFunction.name);
  if (interactive){
    res = await agentFunction(var1, var2);
    console.dir(res, { depth: null })
    const proceed = await prompts({
      type: 'select',
      name: 'value',
      message: 'Approve agent\'s reply ?',
      choices: [
        { title: 'Approve - continue', value: 'continue' },
        { title: 'Retry - Rerun agent', value: 'retry'},
        { title: 'Abort', value: 'abort'}
      ]
    });
    if (proceed.value === 'continue') return res
    if (proceed.value === 'retry') await runAgent(agentFunction, var1, var2, interactive)
    if (proceed.value === 'abort') throw new Error("Aborted")
  }
  return await agentFunction(var1, var2);
}


/**
* Returns an object containing the command line options parsed using the Yargs library.
* @param {boolean} test - A flag indicating whether or not to run in test mode.
* @param {string} task - The task to be completed, or false if not provided.
* @returns {{
  * task: string | false, // The task to be completed, or false if not provided.
  * interactive: boolean, // A flag indicating whether to run in interactive mode.
  * dir: string, // The path to the directory containing the code files.
  * reindex: boolean, // A flag indicating whether to reindex the entire codebase.
  * autoApply: boolean, // A flag indicating whether to auto apply change suggestions.
  * indexGapFill: boolean // A flag indicating whether to check for gaps between the DB and the codebase and reconcile them.
  * }}
*/
function getOptions(task, test){
  const options = yargs
  .option('interactive', {
    alias: 'i',
    describe: 'Whether to run in interactive mode',
    default: false,
    type: 'boolean'
  })
  .option('task', {
    alias: 't',
    describe: 'The task to be completed',
    demandOption: false, // set initial value to false
    default: task,
    type: 'string'
  })
  .option('dir', {
    alias: 'd',
    describe: 'The path to the directory containing the code files',
    default: process.env.CODE_DIR,
    type: 'string'
  })
  .option('auto-apply', {
    alias: 'a',
    describe: 'Auto apply change suggestions',
    default: !test,
    type: 'boolean'
  })
  .option('reindex', {
    alias: 'r',
    describe: 'Reindexes the entire codebase',
    default: false,
    type: 'boolean'
  })
  .option('index-gap-fill', {
    alias: 'g',
    describe: 'Checks for gaps between the DB and the codebase and reconciles them',
    default: true,
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .argv;

  if (!options.interactive && !options.task) {
    console.log('Please provide a task using the -t flag.');
    console.log('  node ui -t task1');
    yargs.showHelp();
    process.exit(1);
  }

  return options;
}


/**
 * Asynchronously reindexes the codebase located at the specified directory, using the specified model for indexing.
 * @param {string} codeBaseDirectory - The path to the codebase directory.
 * @param {Object} model - The model used for indexing the codebase.
 * @param {boolean} interactive - A flag indicating whether to use interactive indexing or not.
 * @returns {Promise} A promise that resolves when the indexing process is complete.
 */
async function reindexCodeBase(codeBaseDirectory, model, interactive) {
  if (interactive) {
    const { codeBaseFullIndexInteractive } = require('./modules/codeBase');
    await codeBaseFullIndexInteractive(codeBaseDirectory, model);
  } else {
    const { codeBaseFullIndex } = require('./modules/codeBase');
    await codeBaseFullIndex(codeBaseDirectory, model);
  }
}


/**
 * 
 * @param {string} task
 * @returns {string}
 * @throws {Error}
 * @description Returns the task to be completed. If the task is not provided as a command line argument, the user is prompted to enter a task.
*/
async function getTask(task, options){
  if (!task) task = options.task
  if (!task && options.interactive) task = await getTaskInput()
  if (!task || task =='') throw new Error("No task provided")
  console.log(`Task: ${task}`)
  return task
}

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
 * 
 * @param {string} task - The task to be completed.
 * @param {boolean} test - Setting for internal tests.
 * @returns {Array} - Array with file and code
 */
async function main(task, test=false, suggestionMode) {
  const options = getOptions(task, test);
  let codeBaseDirectory = options.dir;
  // TODO: get rid of test parameter, should use normal functionality
  if (test){
    codeBaseDirectory = codeBaseDirectory + testingDirectory
  }
  const interactive = options.interactive;
  const reindex = options.reindex;
  const indexGapFillOption = options.indexGapFill;
  let autoApply;
  if (interactive){
    autoApply = false;
  } else {
    autoApply = options.autoApply;
  }

  // init, reindex, or gap fill
  const { initCodeBase } = require('./modules/init');
  await initCodeBase(codeBaseDirectory, interactive);
  if (reindex){
    await reindexCodeBase(codeBaseDirectory, process.env.INDEXER_MODEL, interactive);
  } 
  if (indexGapFillOption && !reindex) {
    console.log(chalk.yellow(`Checking for gaps between the DB and the codebase and reconciling them.`));
    await indexGapFill(codeBaseDirectory, interactive);
  }

  // Make sure we have a task, ask user if needed
  task = await getTask(task, options);

  // Get the summaries of the files in the directory
  const summaries = await getSummaries(codeBaseDirectory);
  const chunkedSummaries = chunkSummaries(summaries, maxSummaryTokenCount);
 
  let relevantFiles=[]
  for (const summaries of chunkedSummaries){
    // Decide which files are relevant to the task
    relevantFilesChunk = await runAgent(agents.getFiles, task, summaries, interactive);
    relevantFiles = relevantFiles.concat(relevantFilesChunk)
  }
  // Fetch code files the agent has deemed relevant
  let files;
  try {
    files = getFiles(codeBaseDirectory, relevantFiles);
  } catch (err) {
    console.log(chalk.red(`The agent has identified files to fetch we couldn't find, please try again with a different task.`));
    console.log(relevantFiles);
    process.exit(1);
  }
  if (files.length == 0) {
    console.log(`The agent has not identified any relevant files for the task: ${task}.\nPlease try again with a different task.`);
    process.exit(1);
  }

  // Ask an agent about each file
  let solutions = [];
  for (const file of files) {

    if (!suggestionMode) { 
      const coderRes = await runAgent(agents.coder, task, file, interactive);
      solutions.push({file:file.path, code:coderRes})

      if (autoApply){
        // This actually applies the solution to the file
        updateFile(file.path, coderRes);
        const filePathFull = file.path
        const fileContent = coderRes
        const filePathRelative = path.relative(codeBaseDirectory, filePathFull);
        console.log(`File modified: ${filePathRelative}`);
        await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent);
      }
    } else {
      // Ask advice agent for a suggestion
      const advice = await runAgent(agents.advisor, task, {relevantFiles, file}, interactive);
      solutions.push({file:file.path, code:advice})
    }

  }
  
  if (autoApply){
    // Sends the saved output to GPT and ask for the necessary changes to do the TASK
    console.log(chalk.green("Solutions Auto applied:"));
    printGitDiff(codeBaseDirectory);
  }else{
    const solutionsPath = saveOutput(solutions);
    console.log(chalk.green("Solutions saved to:", solutionsPath));
  }

  console.log(chalk.green("Process Log:", logPath()));

  return solutions
}

if (require.main === module) main();


module.exports = { main }

/**
 * Searches for gaps in the code base and fills them by deleting unnecessary files and indexing new or modified files.
 * @param {string} codeBaseDirectory - The directory path of the code base to gap fill.
 * @param {boolean} interactive - A flag indicating whether the function should prompt the user for approval before performing the gap fill.
 * @returns {Promise<void>} - A promise that resolves when the gap fill is complete.
 */
async function indexGapFill(codeBaseDirectory, interactive) {
  const { codeBaseGapFill } = require('./modules/codeBase');
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
      const { calculateTokensCost } = require('./modules/gpt');
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
  const { countTokens } = require('./modules/tokenHelper');

  let reindex_content;
  for (const file of filesToIndex) {
    // TODO: for more accuracy need to add the agent prompt
    reindex_content += file.fileContent;
  }
  const tokenCount = countTokens(reindex_content);
  return tokenCount;
}

async function gapFill(filesToDelete, codeBaseDirectory, filesToIndex) {
  const { deleteFile } = require('./modules/db');
  const { generateAndWriteFileSummary } = require('./modules/summaries');

  for (const file of filesToDelete) {
    const filePathRelative = file.path;
    await deleteFile(codeBaseDirectory, filePathRelative);
  }
  for (const file of filesToIndex) {
    const filePathRelative = file.filePath;
    const filePathFull = path.posix.join(codeBaseDirectory, filePathRelative);
    const fileContent = fs.readFileSync(filePathFull, 'utf-8');
    console.log(`File modified: ${filePathRelative}`);
    await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent);
  }
}

