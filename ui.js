

const chalk = require('chalk');
const { getTaskInput } = require('./modules/userInputs');
const { getSummaries, getFiles } = require('./modules/summaries');
const { saveOutput, logPath } = require('./modules/fsOutput');
const agents = require('./agents');
const yargs = require('yargs');
const prompts = require('prompts');
const fs = require('fs');

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
* @returns {{
  *   task: string, // The task to be completed, or false if not provided
  *   interactive: boolean // Whether to run in interactive mode
  *   }}
  */
function getOptions(){
  const options = yargs
  .option('task', {
    alias: 't',
    describe: 'The task to be completed',
    default: '',
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


/**
 * 
 * @param {string} task
 * @returns {string}
 * @throws {Error}
 * @description Returns the task to be completed. If the task is not provided as a command line argument, the user is prompted to enter a task.
*/
async function getTask(task, options){
  if (!task) task = options.task
  if (!task) task = await getTaskInput()
  if (!task || task =='') throw new Error("No task provided")
  console.log(`Task: ${task}`)
  return task
}

function applyPatch(file, patch) {
  const lines = patch.split("\n");
  lines.shift();
  const resCleaned = lines.join("\n")
    .replace(/^```/, "") // Remove "```" from the start of the string
    .replace(/```$/, ""); // Remove "```" from the end of the string

  fs.writeFile(file.path, resCleaned, { flag: 'w' }, (err) => {
    if (err) {
      console.error(err);
      throw new Error("Error writing file" + err);
    }
    console.log(`The file ${file.path} has been updated.`);
  });
  return resCleaned
}

async function createFile(path, content) {
  fs.writeFile(path, content, { flag: 'w' }, (err) => {
    if (err) {
      console.error(err);
      throw new Error("Error creating file" + err);
    }
    console.log(`The file ${path} has been created.`);
  });
}

/**
 * 
 * @param {string} task - The task to be completed.
 * @param {boolean} test - Setting for internal tests.
 * @returns {string}
 */

async function main(task, test) {
  const summaries = await getSummaries(test);
  const options = getOptions();
  const interactive = options.interactive;
  task = await getTask(task, options);
 
  // Decide which files are relevant to the task
  const relevantFiles = await runAgent(agents.getFiles,task, summaries, interactive);
  const files = getFiles(relevantFiles.output.relevantFiles)
  if (files.length == 0) throw new Error("No relevant files found")

  // Ask an agent about each file
  let solutions = [];
  for (const file of files) {
    const patch = await runAgent(agents.coder, task, file, interactive);
    console.log(patch.explanation)
    if (patch.command === 'createFile') {
      await createFile(patch.path, patch.content);
    } else {
      const patchCleaned = applyPatch(file, patch.code);
      solutions.push(patchCleaned);
    }
  }

  //Sends the saved output to GPT and ask for the necessary changes to do the TASK
  const solutionPath = saveOutput(solutions);
  
  console.log(chalk.green("Solution Ready:", solutionPath));
  console.log(chalk.green("Process Log:", logPath()));

  return solutions
}

if (require.main === module) main();


module.exports = { main }

