const path = require('path');
const { createDB } = require('./db');
const fs = require('fs');
const { codeBaseFullIndex, codeBaseFullIndexInteractive } = require('./codeBase');
const { getCodeBaseAutopilotDirectory } = require('./autopilotConfig');

/**
 *
 * @param {string} codeBaseDirectory
 */
function initCodeBase(codeBaseDirectory, interactive){
    model = process.env.CHEAP_MODEL;
    // Create directory `__CODEBASE__/.autopilot`
    codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);
    fs.mkdirSync(codeBaseAutopilotDirectory);

    // Create config file `__CODEBASE__/.autopilot/config.json`
    // TODO: Refactor include/exclude lists into codebase config file

    // Bootstrap DB
    createDB(codeBaseDirectory);

    // Trigger codeBase indexing
    if (interactive){
        codeBaseFullIndexInteractive(codeBaseDirectory, model);
    } else {
        codeBaseFullIndex(codeBaseDirectory, model);
    }
}

module.exports = { initCodeBase }