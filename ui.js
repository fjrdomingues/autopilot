// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.
const chalk = require('chalk');
const { countTokens } = require('./modules/gpt');
const { getTaskInput } = require('./modules/userInputs');
const { readAllSummaries, getFiles } = require('./modules/summaries');
const { saveOutput } = require('./modules/fsOutput');
const agents = require('./agents');

// Gets all .ai.txt files (summaries)
async function readAllSummaries() {
  var files = [];
  try {
    console.log("Getting Summary");
    files = await fg(path.posix.join(process.env.CODE_DIR, '**/*.ai.txt'), { ignore: ignorePattern });
  } catch (err) {
    console.error("Error in fast-glob:", err);
    throw err;

const maxSummaryTokenCount = 3000;
const yargs = require('yargs');

function validateSummaryTokenCount(summariesTokenCount){
  if (summariesTokenCount > maxSummaryTokenCount) {
    message = `Aborting. Too many tokens in summaries. ${chalk.red(summariesTokenCount)} Max allowed: ${chalk.red(maxSummaryTokenCount)}`
    console.log(message)
    throw new Error(message)
  }

  if (files.length === 0) {
    console.log("No matching files found. Try running `node createSummaryOfFiles` first.");
    throw new Error("Can not run without Summaries. Try running `node createSummaryOfFiles` first.");
  }

  let summaries = "";
  console.log("Files found:", files);
  for (const file of files) {
    try {
      const summary = fs.readFileSync(file, 'utf-8');
      summaries += summary + '\n\n';
    } catch (error) {
      console.error("Error reading file:", file, error);
    }
  }
  return summaries;
}

async function runAgent(agentFunction, var1, var2){
  if (interactive){
    let answer = '';
    while (answer !== '1') {
      res = await agentFunction(var1, var2);
      console.log("Agent result: ", res);
  
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
  
      answer = await new Promise(resolve => {
        rl.question('Do you want to proceed?\n1. Approve - continue\n2. Retry - Reruns the agent command\n', (answer) => {
          resolve(answer);
          rl.close();
        });
      });
      if (answer !== '1' && answer !== '2') {
        console.log('Invalid input');
      }
    };
  }
  return res
}

async function main() {
  // Summaries fetch and validate
  const summaries = await readAllSummaries();
  const summariesTokenCount = countTokens(JSON.stringify(summaries))
  validateSummaryTokenCount(summariesTokenCount);
  console.log(`Tokens in Summaries: ${chalk.yellow(summariesTokenCount)}`)

  const options = yargs
  .option('task', {
    alias: 't',
    describe: 'The task to be completed',
    default: await getTaskInput(),
    type: 'string'
  })
  .option('interactive', {
    alias: 'i',
    describe: 'Whether to run in interactive mode',
    default: true,
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .argv;
  interactive = options.interactive;

  // Task fetch and validate
  task = options.task;
  if (!task) task = await getTaskInput()
  if (!task) return "A task is required"
  console.log(`Task: ${task}`)

  // Get files by agent decision
  relevantFiles = await runAgent(agents.getFiles,task, summaries);

  files = getFiles(relevantFiles)

  // Ask an agent about each file
  let tempOutput = '';
  for (const file of files) {
    const relevantContext = await runAgent(agents.codeReader, task, file) ;
    tempOutput += `// ${file.path}\n${JSON.stringify(relevantContext)}\n\n`;
  }
  console.log("Extracted code:", tempOutput)

  //Sends the saved output to GPT and ask for the necessary changes to do the TASK
  const solution = await runAgent(agents.coder, task, tempOutput);
  const solutionPath = saveOutput(task, solution);
  
  console.log(chalk.green("Solution Ready:", solutionPath));
  return solution
}

if (require.main === module) main();

module.exports = { main }
