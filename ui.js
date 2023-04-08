// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.

const fs = require('fs');
const fg = require('fast-glob');
const { countTokens } = require('./modules/gpt');
const chalk = require('chalk');
const path = require('path');
const ignorePattern = ['node_modules/**/*'];
const prompts = require('prompts');

// Agents
const agents = require('./agents');

// Gets all .ai.txt files (summaries)
async function readAllSummaries() {
  var files = [];
  try {
    console.log("Getting Summary");
    const files = await fg(path.posix.join(process.env.CODE_DIR, '**/*.ai.txt'), { ignore: ignorePattern });
  } catch (err) {
    console.error("Error in fast-glob:", err);
    throw err;
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

function savePatchFile(patch) {
  const suggestionsDir = path.join(__dirname, 'suggestions');
  const fileName = `${Date.now()}.patch`;
  const filePath = path.join(suggestionsDir, fileName)

  fs.writeFileSync(filePath, patch);
  return filePath
}

// Asks user for a task
async function getTaskInput() {
  const response = await prompts({
     type: 'text',
     name: 'task',
     message: 'Please enter your TASK (multiline supported):',
     multiline: true,
   });

  return response.task;
}

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
  console.log("Solution:", solution);
  const solutionPath = savePatchFile(solution);

  const { exec } = require('child_process');
  const prompts = require('prompts');

  (async () => {
    const response = await prompts({
      type: 'text',
      name: 'apply',
      message: 'Do you want to apply the generated patch? Please enter "yes" or "no".',
    });
    if (response.apply === 'yes') {
      exec(`git apply ${solutionPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error applying patch: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      });
    }
  })();

  return solution
}

if (require.main === module) main();

module.exports = { main }
