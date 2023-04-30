// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.
const chalk = require('chalk');
const path = require('path');

const { getSummaries, chunkSummaries, maxSummaryTokenCount } = require('./modules/summaries');
const { saveOutput, logPath, updateFile, newLog } = require('./modules/fsOutput');
const { printGitDiff } = require('./modules/gitHelper');
const { getFiles } = require('./modules/fsInput');
const { generateAndWriteFileSummary } = require('./modules/summaries');
const { getOptions } = require('./modules/cliOptions');
const { runAgent } = require('./modules/interactiveAgent');
const { getTask } = require('./modules/interactiveTask');
const { indexGapFill } = require('./modules/interactiveGapFill');
const { reindexCodeBase } = require('./modules/interactiveReindexCodeBase');
const { suggestChanges } = require('./agents/coder');
const { ChangesAdvice } = require('./agents/advisor');
const { getRelevantFiles } = require('./agents/getFiles');

/**
 * 
 * @param {string} task - The task to be completed.
 * @param {boolean} test - Setting for internal tests.
 * @returns {Array} - Array with file and code
 */
async function main(task, test=false, suggestionMode) {
  newLog();
  const options = getOptions(task, test);
  let codeBaseDirectory = options.dir;
  // TODO: get rid of test parameter, should use normal functionality
  if (test){
    const testingDirectory = '/benchmarks';
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
  console.log(`Split summaries into ${chalk.yellow(chunkedSummaries.length)} chunks of ${chalk.yellow(maxSummaryTokenCount)} tokens each. (an agent would run for each)`)
 
  let relevantFiles=[]
  const promises = chunkedSummaries.map(async (summaries) => {
    // Decide which files are relevant to the task
    const relevantFilesChunk = await runAgent(getRelevantFiles, task, summaries, interactive);
    return relevantFilesChunk;
  });
  relevantFiles = await Promise.all(promises).then((results) => {
    // Combine all the results into a single array
    return results.flat();
  });
  
  // Fetch code files the agent has deemed relevant
  let files;
  try {
    files = getFiles(codeBaseDirectory, relevantFiles);
  } catch (err) {
    console.log(chalk.red(`The agent has identified files to fetch we couldn't find, please try again with a different task.`));
    console.log(relevantFiles);
    console.log(`Codebase directory: ${codeBaseDirectory}`)
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
      const coderRes = await runAgent(suggestChanges, task, file, interactive);
      for (const file of coderRes){
        const filePathRelative = file.fileToUpdate;
        const fileContent = file.content; 
        solutions.push({file:filePathRelative, code:fileContent})

        if (autoApply){
          // This actually applies the solution to the file
          const filePathFull = path.posix.join(codeBaseDirectory, filePathRelative);
          updateFile(filePathFull, fileContent);
          console.log(`File modified: ${filePathRelative}`);
          await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent);
        }
        // TODO: get current diff and feed it back to the next agent
      }
    } else {
      // Ask advice agent for a suggestion
      const advice = await runAgent(ChangesAdvice, task, {relevantFiles, file}, interactive);
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