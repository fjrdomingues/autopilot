const dotenv = require('dotenv-extended');
const DEFAULT_CONFIG_FILENAME = '.env.default';

function loadBaseConfig(){
    dotenv.config({ path: DEFAULT_CONFIG_FILENAME, overrideProcessEnv: true});

    const { getUserAutopilotConfigFilePath } = require('./configUser');
    dotenv.config({ path: getUserAutopilotConfigFilePath(), overrideProcessEnv: true });  
}

function loadCodeBaseConfig(codeBaseDirectory){
    const { getCodeBaseAutopilotConfigFilePath } = require("./configCodeBase");
    dotenv.config({ path: getCodeBaseAutopilotConfigFilePath(codeBaseDirectory), overrideProcessEnv: true });
}

module.exports = { loadBaseConfig, loadCodeBaseConfig };