// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.

const fs = require('fs');
const chalk = require('chalk');
const { countTokens } = require('./modules/gpt');
const { getTaskInput } = require('./modules/userInputs');
const { readAllSummaries } = require('./modules/summaries');
const { saveOutput } = require('./modules/fsOutput');

// Agents
const agents = require('./agents');

async function main(task) {
  if (!task) task = await getTaskInput()
  if (!task) return "A task is required"
  
  console.log("Task:", task)

  // Read all summaries (Gets context of all files and project)
  // TODO: add context of project structure
  const summaries = await readAllSummaries();

  console.log("Tokens in Summaries:", countTokens(JSON.stringify(summaries)))

  // A limit to the size of summaries, otherwise they may not fit the context window of gpt3.5
  if (countTokens(summaries.toString()) > 3000) {
    console.log("Aborting. Summary files combined are too big for the context window of gpt3.5")
    return
  }

  //uses GPT AI API to ask what files are relevant to the task and why
  const relevantFiles = await agents.getFiles(task, summaries);
  console.log("Relevant Files are: ", relevantFiles)

  // Using the previous reply, the app gets the source code of each relevant file and sends each to GPT to get the relevant context
  let tempOutput = '';
  for (const file of relevantFiles) {
    const pathToFile = file.path;
    const fileContent = fs.readFileSync(pathToFile, 'utf8');
    file.code = fileContent
    const relevantContext = await agents.codeReader(task, file) ;
    tempOutput += `// ${pathToFile}\n${JSON.stringify(relevantContext)}\n\n`;
  }
  // console.log("Extracted code:", tempOutput)

  //Sends the saved output to GPT and ask for the necessary changes to do the TASK
  const solution = await agents.coder(task, tempOutput);
  const solutionPath = saveOutput(task, solution);
  
  console.log(chalk.green("Solution Ready:", solutionPath));
  return solution
}

if (require.main === module) main();

module.exports = { main }
