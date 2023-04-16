const autopilotDirectoryName = '.autopilot';
const path = require('path');
const { loadFiles } = require('./files');
const generateAndWriteFileSummary = require('./summaries').generateAndWriteFileSummary;

function getCodeBaseAutopilotDirectory(codeBaseDirectory){
    return path.posix.join(codeBaseDirectory, autopilotDirectoryName);
}

/**
 * Calculates the cost of a project by summing the cost of all files in the specified directory.
 * @param {string} codeBaseDirectory - The directory to calculate the project cost for.
 * @param {string} model - The model to use for the cost calculation.
 * @returns {number} - The cost of the project in tokens.
 */
async function codeBaseFullIndex(codeBaseDirectory, model){
    const files = loadFiles(codeBaseDirectory);
  
    for (const file of files) {
      const fileContent = file.fileContent;
      const filePathRelative = file.filePath;
  
      await generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent, model);
    }
  };

module.exports = { getCodeBaseAutopilotDirectory, codeBaseFullIndex }