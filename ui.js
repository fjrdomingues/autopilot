// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.
const chalk = require('chalk');
const agents = require('./agents');
const yargs = require('yargs');
const prompts = require('prompts');
const fs = require('fs');

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
Returns an object containing the command line options parsed using the Yargs library.
* @param {boolean} test - Whether or not to run in test mode.
* @returns {{
*   task: string, // The task to be completed, or false if not provided
*   interactive: boolean // Whether to run in interactive mode
*   }}
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
    describe: 'The path to the directory containing the code files',
    default: !test,
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

/**
 * 
 * @param {string} task - The task to be completed.
 * @param {boolean} test - Setting for internal tests.
 * @returns {Array} - Array with file and code
 */
async function main(task, test=false) {
  const options = getOptions(task, test);
  const interactive = options.interactive;
  let codeBaseDirectory = options.dir;
  if (test){
    codeBaseDirectory = codeBaseDirectory + testingDirectory
  }
  const model = process.env.CHEAP_MODEL;
  let autoApply;
  if (interactive){
    autoApply = false;
  } else {
    autoApply = options.autoApply;
  }

  const { getCodeBaseAutopilotDirectory} = require('./modules/autopilotConfig');
  const codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);
  const initCodeBase = require('./modules/init').initCodeBase;
  if (!fs.existsSync(codeBaseAutopilotDirectory)){
    await initCodeBase(codeBaseDirectory, interactive);
  }

  // Make sure we have a task, ask user if needed
  task = await getTask(task, options);

  // Get the summaries of the files in the directory
  const summaries = await getSummaries(codeBaseDirectory);
  const chunkedSummaries = chunkSummaries(summaries, maxSummaryTokenCount);
 
  let relevantFiles=[]
  for (const summaries of chunkedSummaries){
    // Decide which files are relevant to the task
    reply = await runAgent(agents.getFiles,task, summaries, interactive);
    relevantFiles = relevantFiles.concat(reply.output.relevantFiles)
  }
  // Fetch code files the agent has deemed relevant
  const files = getFiles(relevantFiles)
  if (files.length == 0) throw new Error("No relevant files found")

  // Ask an agent about each file
  let solutions = [];
  for (const file of files) {
    const coderRes = await runAgent(agents.coder, task, file, interactive);
    solutions.push({file:file.path, code:coderRes})

    if (autoApply){
      // This actually applies the solution to the file
      updateFile(file.path, coderRes);
      const filePathFull = file.path
      const fileContent = coderRes
      const filePathRelative = path.relative(codeBaseDirectory, filePathFull);
      console.log(`File modified: ${filePathRelative}`);
      await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent, model);
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
