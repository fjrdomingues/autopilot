const path = require('path');
const autopilotDirectoryName = '.autopilot';

/**
 * Returns the path of the directory containing the autopilot files within the codebase directory.
 * @param {string} codeBaseDirectory - The path of the codebase directory.
 * @returns {string} - The path of the autopilot config sub-directory.
 */
function getCodeBaseAutopilotDirectory(codeBaseDirectory) {
  return path.posix.join(codeBaseDirectory, autopilotDirectoryName);
}

module.exports = { getCodeBaseAutopilotDirectory };