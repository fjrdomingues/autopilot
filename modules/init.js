const path = require('path');
const { createDB } = require('./db');
const fs = require('fs');
const { getCodeBaseAutopilotDirectory } = require('./codeBase');

/**
 *
 * @param {string} codeBaseDirectory
 */
function initCodeBase(codeBaseDirectory){
    // Create directory `__CODEBASE__/.autopilot`
    codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);
    fs.mkdirSync(codeBaseAutopilotDirectory);

    // Create config file `__CODEBASE__/.autopilot/config.json`
    // TODO: Refactor include/exclude lists into codebase config file

    // Bootstrap DB
    createDB(codeBaseDirectory);

    // Trigger codeBase indexing
    // TODO
}

module.exports = { initCodeBase }