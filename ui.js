// This file is the UI for the user. It accepts a TASK from the user and uses AI to complete the task. Tasks are related with code.

const fs = require('fs');
const readline = require('readline');
const fg = require('fast-glob');
const { callGPT } = require('./modules/gpt');
const chalk = require('chalk');
const path = require('path');
const ignorePattern = ['node_modules/**/*', 'autopilot/**/*'];
const prompts = require('prompts');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getRelevantFiles(task, summaries) {
  const prompt = `
    Codebase Summary:
    ---
    ${summaries}
    ---
    Your TASK: ${task}
    Identify the main files in the existing codebase that are relevant to your TASK. If you want to create a new file, don't include it in the output.
    For each file explain also what is relevant in this file to complete the TASK.
    Use the following JSON format:
    \`\`\`
    [{"path": "<insert file name and path>", "context": "<insert context>"},{"path": "<insert file and path>", "context": "<insert context>"}]
    \`\`\`
  `;

  const reply = await callGPT(prompt, "gpt-3.5-turbo");
  const parsedReply = parseArray(reply)
  return parsedReply;
}

async function suggestChanges(task, functionSourceCode) {

  const prompt = `
    You are a software developer with 10 years of experience. You were asked to solve the TASK. For context, here is the relevant source code:
    ---
    ${functionSourceCode}
    ---
    Your TASK: ${task}
  `;

  const reply = await callGPT(prompt, "gpt-4");

  // Add a celebration emoji after finishing the task
  const celebrationEmoji = '🎉';
  const replyWithCelebration = `${reply} ${celebrationEmoji}`;

  return replyWithCelebration;
}

async function readAllSummaries() {
  console.log("Getting Summary");
  try {
    const files = await fg("**/*.ai.txt", { ignore: ignorePattern });
    console.log("Files found:", files);

    if (files.length === 0) {
      console.log("No matching files found.");
      return [];
    }

    const summaries = [];
    for (const file of files) {
      try {
        const summary = fs.readFileSync(file, 'utf-8');
        summaries.push(summary);
      } catch (error) {
        console.error("Error reading file:", file, error);
      }
    }

    return summaries;
  } catch (err) {
    console.error("Error in fast-glob:", err);
    throw err;
  }
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(chalk.green(prompt), (answer) => {
      resolve(answer);
    });
  });
}

function parseArray(gptReply) {
  const regex = /\[([^\]]+)\]/;
  const match = gptReply.match(regex);

  if (match && match[1]) {
    const functionData = JSON.parse('[' + match[1] + ']');
    return functionData;
  }

  return [];
}


function saveOutput(task, solution) {
 // Save the solution to a file in the "suggestions" folder
 const suggestionsDir = 'suggestions';
 const fileName = `${Date.now()}.md`;

 // Ensure the "suggestions" folder exists
 if (!fs.existsSync(suggestionsDir)) {
   fs.mkdirSync(suggestionsDir);
 }

 // Write the suggestion to the file
 fs.writeFileSync(path.join(suggestionsDir, fileName), `# TASK \n ${task}\n# SOLUTION\n${solution}`);
}


async function getRelevantContextForFile(task, file) {
  const prompt = `
    You are a software developer. You were asked to solve a TASK and you have been gathering context of the codebase. One of the files has the following code:
    ${file.path}
    \`\`\`
    ${file.code}
    \`\`\`
    This file is relevant because ${file.context}
    Your TASK: ${task}
    Output: Identify and output the relevant source code from this file, taking into account the context and TASK. Don't modify the code.
  `;

  const reply = await callGPT(prompt, "gpt-3.5-turbo");
  return reply;
}

async function getTaskInput() {
  const response = await prompts({
     type: 'text',
     name: 'task',
     message: 'Please enter your TASK (multiline supported):',
     multiline: true,
   });

  return response.task;
}

async function main() {
  const task = await getTaskInput();
  console.log("Task:", task)

  // Read all summaries (Gets context of all files and project)
  // TODO: add context of project structure
  const summaries = await readAllSummaries();

  //uses GPT AI API to ask what files are relevant to the task and why
  const relevantFiles = await getRelevantFiles(task, summaries);
  console.log("Relevant Files are: ", relevantFiles)

  // Using the previous reply, the app gets the source code of each relevant file and sends each to GPT to get the relevant context
  let tempOutput = '';
  for (const file of relevantFiles) {
    const pathToFile = file.path
    const fileContent = fs.readFileSync(pathToFile, 'utf8');
    file.code = fileContent
    const relevantContext = await getRelevantContextForFile(task, file) ;
    tempOutput += `// ${pathToFile}\n${relevantContext}\n\n`;
  }
  console.log("Extracted code:", tempOutput)

  //Sends the saved output to GPT and ask for the necessary changes to do the TASK
  const solution = await suggestChanges(task, tempOutput);
  saveOutput(task, solution);
  
  console.log(chalk.yellow('\nSuggested changes:'));
  console.log(chalk.gray(solution));
  rl.close();
}

main();
