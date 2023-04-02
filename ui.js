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
    What functions from the source code do you need access to in order to complete the TASK? Please list them in an array like described below (JSON)
    \`\`\`
    array = [{"name": "functionName1", "path": "path/to/file1"}, {"name": "functionName2", "path": "path/to/file2"}]
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
    const functionData = JSON.parse('[' + match[1] + ']');
    return functionData;
  }

  return [];
}

function getFunctionSourceCode(functionName, fileContent) {
  const ast = acorn.parse(fileContent, { ecmaVersion: 'latest', sourceType: 'module' });
  let functionSourceCode = '';

  function walkNode(node) {
    if (
      (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') &&
      node.id && node.id.name === functionName
    ) {
      functionSourceCode = fileContent.substring(node.start, node.end);
    } else {
      for (const key in node) {
        const value = node[key];
        if (typeof value === 'object' && value !== null) {
          walkNode(value);
        }
      }
    }
  }

  walkNode(ast);

  if (functionSourceCode) {
    return functionSourceCode;
  } else {
    console.error(`Error: Function "${functionName}" not found in the given content.`);
    return '';
  }
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


function getSourceCodeForFunctions(functions) {
  let sourceCode = '';
  for (const functionObj of functions) {
    const { name, path: filePath } = functionObj;
    console.log(chalk.yellow("Files loop: "), filePath, name)
    const fileContent = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    const functionSourceCode = getFunctionSourceCode(name, fileContent);
    console.log(functionSourceCode)
    sourceCode += `// ${filePath}\n${functionSourceCode}\n\n`;
  }

  return sourceCode;
}

async function main() {
  const task = await question('What is the task you want to implement? ');

  // Read all summaries (Gets context of all files and project)
  // TODO: add context of project structure
  const summaries = await readAllSummaries();
  // console.log("Got Summaries:", summaries)

  

  // Get the relevant functions from the summaries
  const relevantFunctionsGPT = await getRelevantFunctions(task, summaries);
  // console.log('Got Relevant functions:', relevantFunctionsGPT)
  
  // Parse output from GPT into an array of functions
  const parsedFunctions = parseFunctionNames(relevantFunctionsGPT);
  console.log('Parsed functions to array:', parsedFunctions)
  
  const functionSourceCode = await getSourceCodeForFunctions(parsedFunctions);
  // Get source code from functions
  // const functionSourceCode = await getFunctionSourceCode(relevantFunctions);
  console.log("Source code:", functionSourceCode)
  
  // Suggest changes based on the relevant functions and their source code
  const solution = await suggestChanges(task, functionSourceCode);
  
  saveOutput(task, solution)
  
  console.log(chalk.yellow('\nSuggested changes:'));
  console.log(chalk.gray(solution));
  rl.close();
}

main();
