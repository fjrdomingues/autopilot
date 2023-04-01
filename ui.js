const fs = require('fs');
const readline = require('readline');
const fg = require('fast-glob');
const { callGPT } = require('./gpt');
const chalk = require('chalk');
const wordCount = require('word-count');
const acorn = require('acorn');
const path = require('path');


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getRelevantFunctions(task, summaries) {
  const prompt = `
    You are a software developer with 10 years of experience. You were asked to solve the TASK. For context, here is a summary of the current codebase:
    ---
    ${summaries}
    ---
    Your TASK: ${task}
    What functions from the source code do you need access to in order to complete the TASK? Please list them in an array like described below
    \`\`\`
    array = [functionName1, functionName2]
    \`\`\`
  `;

  const reply = await callGPT(prompt);
  return reply;
}

async function suggestChanges(task, functionSourceCode) {

  const prompt = `
    You are a software developer with 10 years of experience. You were asked to solve the TASK. For context, here is the source code of the relevant functions:
    ---
    ${functionSourceCode}
    ---
    Your TASK: ${task}
  `;

  const reply = await callGPT(prompt);

  // Add a celebration emoji after finishing the task
  const celebrationEmoji = '🎉';
  const replyWithCelebration = `${reply} ${celebrationEmoji}`;

  return replyWithCelebration;
}

async function readAllSummaries() {
  console.log("Getting Summary");
  const ignorePattern = ['node_modules/**/*', 'aiDev/**/*'];
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

function parseFunctionNames(gptReply) {
  const regex = /\[([^\]]+)\]/;
  const match = gptReply.match(regex);

  if (match && match[1]) {
    const functionNames = match[1].split(',').map((name) => name.trim());
    return functionNames;
  }

  return [];
}

// uses acorn to parse files and extract the source code for the functions in the array
async function getFunctionSourceCode(functionNames) {
  const ignorePattern = ['node_modules/**/*', 'aiDev/**/*'];
  const files = await fg("**/*.{js,jsx,ts,tsx}", { ignore: ignorePattern });
  let functionSourceCode = '';

  for (const file of files) {
    try {
      const fileContent = fs.readFileSync(file, 'utf-8');
      const ast = acorn.parse(fileContent, { ecmaVersion: 'latest', sourceType: 'module' });

      const findFunctionNodes = (node) => {
        if (
          (node.type === 'FunctionDeclaration' && functionNames.includes(node.id.name)) ||
          (node.type === 'VariableDeclarator' &&
            node.init &&
            node.init.type === 'FunctionExpression' &&
            functionNames.includes(node.id.name))
        ) {
          return fileContent.slice(node.start, node.end);
        }

        let foundFunction = '';
        if (node.body) {
          const bodyNodes = Array.isArray(node.body) ? node.body : node.body.body;
          if (bodyNodes) {
            for (const childNode of bodyNodes) {
              foundFunction = findFunctionNodes(childNode);
              if (foundFunction) {
                break;
              }
            }
          }
        }
        return foundFunction;
      };

      for (const functionName of functionNames) {
        const functionCode = findFunctionNodes(ast);
        if (functionCode) {
          functionSourceCode += `File: ${file}\n\n${functionCode}\n\n`;
        }
      }
    } catch (error) {
      console.error("Error reading file:", file, error);
    }
  }

  return functionSourceCode;
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
 fs.writeFileSync(path.join(suggestionsDir, fileName), task, '\n', solution);
}

async function main() {
  const task = await question('What is the task you want to implement? ');
  // Read all summaries
  const summaries = await readAllSummaries();
  // console.log("Got Summaries:", summaries)

  // Get the relevant functions from the summaries
  const relevantFunctions = await getRelevantFunctions(task, summaries);
  console.log('Got Relevant functions:', relevantFunctions)

  // Parse output from GPT into an array of functions
  const parsedFunction = parseFunctionNames(relevantFunctions)
  console.log('Parsed functions to array:', parsedFunction)

  // Get source code from functions
  const functionSourceCode = await getFunctionSourceCode(relevantFunctions);
  console.log("Source code:", functionSourceCode)
  
  rl.close();
  return
  // Suggest changes based on the relevant functions and their source code
  const solution = await suggestChanges(task, functionSourceCode);
 
  saveOutput(task, solution)

  console.log(chalk.yellow('\nSuggested changes:'));
  console.log(chalk.gray(solution));
  rl.close();
}

main();
