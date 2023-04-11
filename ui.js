// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.
const chalk = require('chalk');
const { getTaskInput } = require('./modules/userInputs');
const { getSummaries, getFiles } = require('./modules/summaries');
const { saveOutput, logPath } = require('./modules/fsOutput');
const agents = require('./agents');
const yargs = require('yargs');
const prompts = require('prompts');

/**
@description Asynchronous function that runs an agent function with given variables.
@param {function} agentFunction - The agent function to be executed asynchronously.
@param {any} var1 - The first variable to be passed as an argument to the agent function.
@param {any} var2 - The second variable to be passed as an argument to the agent function.
@param {boolean} interactive=false - A boolean indicating whether or not to prompt the user for approval after running the agent function.
@returns {Promise<any>} A Promise that resolves with the return value of the agent function if not in interactive mode, otherwise resolves or rejects based on user input.
*/
async function runAgent(agentFunction, var1, var2, interactive=false){
  if (interactive){
    res = await agentFunction(var1, var2);
    console.log("(agent)", agentFunction.name);
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
* @returns {
*   task: string | false, // The task to be completed, or false if not provided
*   interactive: boolean // Whether to run in interactive mode
*   }
*/
function getOptions(){
  const options = yargs
  .option('task', {
    alias: 't',
    describe: 'The task to be completed',
    default: false,
    type: 'string'
  })
  .option('interactive', {
    alias: 'i',
    describe: 'Whether to run in interactive mode',
    default: false,
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .argv;
  return options;
}

async function main(task, test) {
  summaries = await getSummaries(test);
  options = getOptions();
  interactive = options.interactive;

  // Task fetch and validate
  if (options.task) task = options.task;
  if (!task) task = await getTaskInput()
  if (!task) return "A task is required"
  console.log(`Task: ${task}`)

  // Decide which files are relevant to the task
  relevantFiles = await runAgent(agents.getFiles,task, summaries, interactive);
  files = getFiles(relevantFiles.output.relevantFiles)

  // Ask an agent about each file
  let relevantCode = [];
  for (const file of files) {
    const res = await runAgent(agents.codeReader, task, file, interactive);
    relevantCode.push({path: file.path, code: res.output.relevantCode})
  }

  //Sends the saved output to GPT and ask for the necessary changes to do the TASK
  const solution = await runAgent(agents.coder, task, relevantCode, interactive);
  const solutionPath = saveOutput(solution);
  
  console.log(chalk.green("Solution Ready:", solutionPath));
  console.log(chalk.green("Process Log:", logPath()));

  return solution
}

if (require.main === module) main();


module.exports = { main }
