const path = require('path');
const fs = require('fs');

const autopilotDirectoryName = '.autopilot';
const configFileName = '.env';

/**
 * Returns the path of the directory containing the autopilot files within the codebase directory.
 * @param {string} codeBaseDirectory - The path of the codebase directory.
 * @returns {string} - The path of the autopilot config sub-directory.
 */
function getCodeBaseAutopilotDirectory(codeBaseDirectory) {
  return path.posix.join(codeBaseDirectory, autopilotDirectoryName);
}

function getCodeBaseAutopilotConfigFilePath(codeBaseDirectory) {
  const codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);
  if (!fs.existsSync(codeBaseAutopilotDirectory)){
    fs.mkdirSync(codeBaseAutopilotDirectory);
  }

  return path.posix.join(codeBaseAutopilotDirectory, configFileName);
}

module.exports = { getCodeBaseAutopilotDirectory, getCodeBaseAutopilotConfigFilePath };