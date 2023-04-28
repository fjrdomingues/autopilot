const path = require('path');
const { createDB } = require('./db');
const fs = require('fs');
const { codeBaseFullIndex, codeBaseFullIndexInteractive } = require('./codeBase');
const { getCodeBaseAutopilotDirectory } = require('./autopilotConfig');

/**
 *
 * @param {string} codeBaseDirectory
 */
async function initCodeBase(codeBaseDirectory, interactive){
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