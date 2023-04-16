const fs = require('fs');
const path = require('path');

const { generateAndWriteFileSummary } = require('./modules/summaries');

require('dotenv').config();

// Prompt the user to proceed
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function getOptions(){
  const yargs = require('yargs');

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
  .help()
  .alias('help', 'h')
  .argv;

  return options;
}

async function main() {
  const fileExtensionsToProcess = process.env.FILE_EXTENSIONS_TO_PROCESS.split(',');
  const chokidar = require('chokidar');

  const options = getOptions();
  const codeBaseDirectory = options.dir;
  const model = options.model;

  const getCodeBaseAutopilotDirectory = require('./modules/codeBase').getCodeBaseAutopilotDirectory;
  const codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);
  const initCodeBase = require('./modules/init').initCodeBase;
  if (!fs.existsSync(codeBaseAutopilotDirectory)){
    initCodeBase(codeBaseDirectory);
  }

  if (options.all) { await indexFullProject(codeBaseDirectory, model); }
  // Watch for file changes in the directory
  const watcher = chokidar.watch(codeBaseDirectory, {
    ignored: /node_modules|helpers/,
    persistent: true,
    ignoreInitial: true,
  });
  // Process the modified file
  watcher.on('change', async (filePathFull) => {
    if (fileExtensionsToProcess.includes(path.extname(filePathFull))) {
      const fileContent = fs.readFileSync(filePathFull, 'utf-8');
      const filePathRelative = path.relative(codeBaseDirectory, filePathFull).replace(/\\/g, '/');
      console.log(`File modified: ${filePathRelative}`);
      await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent, model);
    }
  });

  console.log('Watching for file changes...');
  readline.close();
}

main();
