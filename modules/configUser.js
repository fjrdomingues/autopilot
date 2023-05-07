const path = require('path');
const os = require('os');
const fs = require('fs');

const autopilotDirectoryName = '.autopilot';
const configFileName = '.env';

/**
 * Returns the path of the directory containing the autopilot files within the users home directory.
 * @returns {string} - The path of the autopilot config sub-directory.
 */
function getUserAutopilotDirectory() {
  return path.posix.join(os.homedir(), autopilotDirectoryName);
}

function getUserAutopilotConfigFilePath() {
  const userAutopilotDirectory = getUserAutopilotDirectory();
  if (!fs.existsSync(userAutopilotDirectory)){
    fs.mkdirSync(userAutopilotDirectory);
  }

  return path.posix.join(userAutopilotDirectory, configFileName);
}

module.exports = { getUserAutopilotDirectory, getUserAutopilotConfigFilePath };