const chalk = require('chalk');
const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { callGPT, calculateTokensCost, countTokens } = require('./modules/gpt');
const prompts = require('prompts');

let ignoreList = process.env.IGNORE_LIST.split(',');
let fileExtensionsToProcess = process.env.FILE_EXTENSIONS_TO_PROCESS.split(',');

const dotenv = require('dotenv');
try {
  dotenv.config()
} catch (error) {
  console.error("Error loading .env file:", error);
}


const calculateProjectSize = (dir) => {
  let projectSize = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && !ignoreList.includes(file)) {
      projectSize += calculateProjectSize(filePath);
    } else if (fileExtensionsToProcess.includes(path.extname(filePath))) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      projectSize += fileContent;
    }
  }

  return projectSize;
};


const processDirectory = async (dir, model) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && !ignoreList.includes(file)) {
      await processDirectory(filePath, model);
    } else if (fileExtensionsToProcess.includes(path.extname(filePath))) {
      const file = fs.readFileSync(filePath, 'utf8')
      console.log(filePath, countTokens(file))
      if (countTokens(file) > 3000) {
        console.log('File too BIG')
        continue
      }
      await processFile(filePath, model);
    }
  }
};

const processFile = async (filePath, model) => {
  try {
    let fileContent = fs.readFileSync(filePath, 'utf-8');

    const prompt = 
`
TASK: Create a summary of the file below. Use as few words as possible while keeping the details. Use bullet points
*** FILE CONTENT START ***
${fileContent}
*** FILE CONTENT END ***
`
    const output = await callGPT(prompt, model)

    if (output) {
        // Save new comment
        const summaryPath = path.join(filePath + '.ai.txt');
        // adds filepath to top of summary
        const contentToRight = `File Path: ${filePath}\nSummary:\n${output}`
        fs.writeFileSync(summaryPath, contentToRight);
        const timestamp = new Date().toISOString();
        const hour = timestamp.match(/\d\d:\d\d/);

        console.log(`${hour}: Updated ${summaryPath}`);
    }
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
  }
};

// Prompt the user to proceed
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  const options = yargs
  .option('dir', {
    alias: 'd',
    describe: 'The path to the directory containing the code files',
    default: process.env.CODE_DIR,
    type: 'string'
  })
  .option('all', {
    describe: 'Whether to perform a full analysis of all code files',
    default: false,
    type: 'boolean'
  })
  .option('model', {
    alias: 'm',
    describe: 'The name of the model to generate the analysis summary',
    default: process.env.SUMMARY_MODEL,
    type: 'string'
  })
  .option('conf', {
    alias: 'cf',
    describe: 'The name of a json file containing .env variables. This will override any defaults in the .env file. This is useful for running multiple instances of the script with different configurations.',
    default: '',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .argv;

  let directoryPath = options.dir;
  let model = options.model;

  const fullAnalysis = options.all;
  
  const conf = options.conf;
  if (conf) {
    console.log(`Using config file: ${conf}`);

    // Read the contents of the configuration file
    const configFileContents = fs.readFileSync(conf, 'utf8');
    const configData = JSON.parse(configFileContents);

    // Update the environment variables
    for (const key in configData) {
      // Ignore the OPENAI_API_KEY variable
      if (key === "OPENAI_API_KEY") {
        continue;
      }

      process.env[key] = configData[key];
      //console.log(`Set ${key} to ${configData[key]}`);
    }

    if (configData["CODE_DIR"]) {
      directoryPath = process.env.CODE_DIR;
      console.log(`Using CODE_DIR: ${directoryPath}`);
    }
    if (configData["SUMMARY_MODEL"]) {
      model = process.env.SUMMARY_MODEL;
      console.log(`Using SUMMARY_MODEL: ${model}`);
    }
    if (configData["IGNORE_LIST"]) {
      ignoreList = process.env.IGNORE_LIST.split(',');
      console.log(`Using IGNORE_LIST: ${ignoreList}`);
    }
    if (configData["FILE_EXTENSIONS_TO_PROCESS"]) {
      fileExtensionsToProcess = process.env.FILE_EXTENSIONS_TO_PROCESS.split(',');
      console.log(`Using FILE_EXTENSIONS_TO_PROCESS: ${fileExtensionsToProcess}`);
    }
  }

  if (fullAnalysis) {
    // Calculate and display the project size
    const projectSize = calculateProjectSize(directoryPath);
    tokenCount = countTokens(projectSize)
    cost = calculateTokensCost(model, tokenCount, null, tokenCount)
    
    console.log(`Project size: ~${tokenCount} tokens, estimated cost: $${chalk.yellow(cost.toFixed(4))}`);

    const proceed = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'Proceed with summarizing the project?',
    });

    if (proceed.value) {
      // Process the initial directory
      await processDirectory(directoryPath, model);
    } else {
      console.log('Aborted summarizing the project.');
    }
  }
  // Watch for file changes in the directory
  const watcher = chokidar.watch(directoryPath, {
    ignored: /node_modules|helpers/,
    persistent: true,
    ignoreInitial: true,
  });
  // Process the modified file
  watcher.on('change', async (filePath) => {
    if (fileExtensionsToProcess.includes(path.extname(filePath))) {
      console.log(`File modified: ${filePath}`);
      await processFile(filePath, model);
    }
  });

  console.log('Watching for file changes...');
  readline.close();
}

main();
