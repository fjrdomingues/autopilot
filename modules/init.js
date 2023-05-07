const path = require('path');
const { createDB } = require('./db');
const fs = require('fs');
const { codeBaseFullIndex, codeBaseFullIndexInteractive } = require('./codeBase');
const { getCodeBaseAutopilotDirectory } = require('./autopilotConfig');
const chalk = require('chalk');
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

/**
 *
 * @param {string} codeBaseDirectory
 */
async function initCodeBase(codeBaseDirectory, interactive){
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length < openAIApiKeyLength) {
    const os = require('os');
    const openAIApiKey = await askForOpenAIKey();
    const homeAutopilotDirectory = path.join(os.homedir(), '.autopilot');
    if (!fs.existsSync(homeAutopilotDirectory)){
      fs.mkdirSync(homeAutopilotDirectory);
    }
    const homeEnvPath = path.join(homeAutopilotDirectory, '.env');
    const homeEnvContent = `OPENAI_API_KEY=${openAIApiKey}`;
    
    if (openAIApiKey){
      fs.writeFileSync(homeEnvPath, homeEnvContent);
      console.log(chalk.green(`OpenAIKey saved to ${homeEnvPath}`));
    }

    const dotenv = require('dotenv');
    dotenv.config({ path: path.posix.join(os.homedir(), '.autopilot', '.env') });    
  }

  model = process.env.INDEXER_MODEL;
  // Create directory `__CODEBASE__/.autopilot`
  codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);

  if (!fs.existsSync(codeBaseAutopilotDirectory)){
    fs.mkdirSync(codeBaseAutopilotDirectory);
  }

  // Create config file `__CODEBASE__/.autopilot/config.json`
  // TODO: Refactor include/exclude lists into codebase config file

  const { getDBFilePath } = require('./db');
  // Bootstrap DB
  if (!fs.existsSync(getDBFilePath(codeBaseDirectory))){
    createDB(codeBaseDirectory);
    // Trigger codeBase indexing
    if (interactive){
      await codeBaseFullIndexInteractive(codeBaseDirectory, model);
    } else {
      await codeBaseFullIndex(codeBaseDirectory);
    }
  }
}

module.exports = { initCodeBase }