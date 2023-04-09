// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.
const chalk = require('chalk');
const { countTokens } = require('./modules/gpt');
const { getTaskInput } = require('./modules/userInputs');
const { readAllSummaries, getFiles } = require('./modules/summaries');
const { saveOutput } = require('./modules/fsOutput');
const agents = require('./agents');
const maxSummaryTokenCount = 3000;

function validateSummaryTokenCount(summariesTokenCount){
  if (summariesTokenCount > maxSummaryTokenCount) {
    message = `Aborting. Too many tokens in summaries. ${chalk.red(summariesTokenCount)} Max allowed: ${chalk.red(maxSummaryTokenCount)}`
    console.log(message)
    throw new Error(message)
  }
}

async function main(task) {
  if (!task) task = await getTaskInput()
  if (!task) return "A task is required"
  console.log(`Task: ${task}`)

  // Summaries fetch and validate
  const summaries = await readAllSummaries();
  const summariesTokenCount = countTokens(JSON.stringify(summaries))
  validateSummaryTokenCount(summariesTokenCount);
  console.log(`Tokens in Summaries: ${chalk.yellow(summariesTokenCount)}`)

  // Get files by agent decision
  const relevantFiles = await agents.getFiles(task, summaries);
  console.log("Relevant Files are: ", relevantFiles)
  files = getFiles(relevantFiles)

  // Ask an agent about each file
  let tempOutput = '';
  for (const file of files) {
    const relevantContext = await agents.codeReader(task, file) ;
    tempOutput += `// ${file.path}\n${JSON.stringify(relevantContext)}\n\n`;
  }
  console.log("Extracted code:", tempOutput)

  //Sends the saved output to GPT and ask for the necessary changes to do the TASK
  const solution = await agents.coder(task, tempOutput);
  const solutionPath = saveOutput(task, solution);
  
  console.log(chalk.green("Solution Ready:", solutionPath));
  return solution
}

if (require.main === module) main();

module.exports = { main }
