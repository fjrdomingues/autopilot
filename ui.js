// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.
const chalk = require('chalk');
const { countTokens } = require('./modules/gpt');
const { getTaskInput } = require('./modules/userInputs');
const { readAllSummaries, getFiles } = require('./modules/summaries');
const { saveOutput, logPath } = require('./modules/fsOutput');
const agents = require('./agents');
const maxSummaryTokenCount = 3000;
const yargs = require('yargs');
const prompts = require('prompts');

function validateSummaryTokenCount(summariesTokenCount){
  if (summariesTokenCount > maxSummaryTokenCount) {
    message = `Aborting. Too many tokens in summaries. ${chalk.red(summariesTokenCount)} Max allowed: ${chalk.red(maxSummaryTokenCount)}`
    console.log(message)
    throw new Error(message)
  }
}

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

// Summaries fetch and validate
async function getSummaries(){
  const summaries = await readAllSummaries(test);
  const summariesTokenCount = countTokens(JSON.stringify(summaries))
  validateSummaryTokenCount(summariesTokenCount);
  console.log(`Tokens in Summaries: ${chalk.yellow(summariesTokenCount)}`)

  return summaries
}

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
  summaries = await getSummaries();
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
