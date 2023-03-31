const fs = require('fs');
const readline = require('readline');
const fg = require('fast-glob');
const { callGPT } = require('./gpt');
const chalk = require('chalk');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readAllSummaries() {
  console.log("getting files");
  const ignorePattern = 'node_modules/**/*';
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

async function suggestChanges(task) {
  const summaries = await readAllSummaries();
  console.log("Got summaries");
  const prompt = `
    You are a software developer. Solve the TASK. Here the context of the current codebase:
    ---
    ${summaries}
    ---
    TASK: ${task}
  `;
  console.log("calling gpt");
  const reply = await callGPT(prompt);
  return reply;
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(chalk.green(prompt), (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const task = await question('What is the task you want to implement? ');
  const solution = await suggestChanges(task);
  console.log(chalk.yellow('\nSuggested changes:'));
  console.log(chalk.gray(solution));
  rl.close();
}

main();
