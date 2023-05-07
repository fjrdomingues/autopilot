const { createDB } = require('./db');
const fs = require('fs');
const { codeBaseFullIndex, codeBaseFullIndexInteractive } = require('./codeBase');
const { getCodeBaseAutopilotDirectory, getCodeBaseAutopilotConfigFilePath } = require('./configCodeBase');
const chalk = require('chalk');
const { getUserAutopilotConfigFilePath, getUserAutopilotDirectory } = require('./configUser');
const openAIApiKeyLength = 51;

/**
 * 
 * @returns {Promise<string>} OpenAIKey
 */
async function askForOpenAIKey(){
  const prompts = require('prompts');

  const openAIApiKey = await prompts({
    type: 'password',
    name: 'value',
    require: true,
    message: 'OpenAIKey (https://platform.openai.com/account/api-keys)',
    validate: value => value.length == openAIApiKeyLength ? true : 'Please enter an OpenAIKey'
  });
  return openAIApiKey.value;
}

async function askForFilesToProcess(){
  const prompts = require('prompts');

  const filesToProcess = await prompts({
    type: 'text',
    name: 'value',
    require: true,
    message: 'File extensions to process (comma separated)',
    initial: '.js,.tsx,.ts,.jsx',
    validate: (value) => {
      if (!value) {
        return 'Please enter at least one file extension.';
      }
      return true;
    },
  });
  return filesToProcess.value;
}

async function askForIgnoreList(){
  const prompts = require('prompts');

  const ignoreList = await prompts({
    type: 'text',
    name: 'value',
    require: true,
    message: 'Directories and files to ignore (comma separated)',
    initial: 'node_modules,coverage,public,__tests__',
  });
  return ignoreList.value;
}

/**
 *
 * @param {string} codeBaseDirectory
 */
async function initCodeBase(codeBaseDirectory, interactive){
  // OPENAI_API_KEY missing or invalid
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length < openAIApiKeyLength) {
    const openAIApiKey = await askForOpenAIKey();
    const userConfigPath = getUserAutopilotConfigFilePath();
    const userConfigContent = `OPENAI_API_KEY=${openAIApiKey}`;
    
    if (!openAIApiKey){
      console.log(chalk.red('Please enter a valid OpenAIKey.'));
      process.exit(1);
    }
    fs.writeFileSync(userConfigPath, userConfigContent);
    console.log(chalk.green(`OpenAIKey saved to ${userConfigPath}`));

    const { loadBaseConfig } = require('./config');
    loadBaseConfig();   
  }

  // FILE_EXTENSIONS_TO_PROCESS or IGNORE_LIST missing
  if (!process.env.FILE_EXTENSIONS_TO_PROCESS || !process.env.IGNORE_LIST) {
    const filesToProcess = await askForFilesToProcess();
    const ignoreList = await askForIgnoreList();

    if (!filesToProcess || !ignoreList){
      console.log(chalk.red('Please enter valid values for file extensions to process and ignore list.'));
      process.exit(1);
    }

    const codeBaseAutopilotConfigFilePath = getCodeBaseAutopilotConfigFilePath(codeBaseDirectory);
    const codeEnvPath = codeBaseAutopilotConfigFilePath;
    const codeEnvContent = `
FILE_EXTENSIONS_TO_PROCESS=${filesToProcess}
IGNORE_LIST=${ignoreList}`;
    fs.writeFileSync(codeEnvPath, codeEnvContent);
    console.log(chalk.green(`Codebase config saved to ${codeEnvPath}`));
    const { loadCodeBaseConfig } = require('./config');  
    loadCodeBaseConfig(codeBaseDirectory);
  }
  
  // Create config file `__CODEBASE__/.autopilot/config.json`
  // TODO: Refactor include/exclude lists into codebase config file

  const { getDBFilePath } = require('./db');
  // Bootstrap DB
  if (!fs.existsSync(getDBFilePath(codeBaseDirectory))){
    createDB(codeBaseDirectory);
    // Trigger codeBase indexing
    if (interactive){
      const model = process.env.INDEXER_MODEL;
      await codeBaseFullIndexInteractive(codeBaseDirectory, model);
    } else {
      await codeBaseFullIndex(codeBaseDirectory);
    }
  }
}

module.exports = { initCodeBase }