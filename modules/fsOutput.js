const fs = require('fs');
const path = require('path');
const outputFolder = 'suggestions';
const logsDirectory = 'logs';
const logsExtension = '.txt';
const logsFilename = new Date().toISOString().replace(/:/g, '-')

/**
 * Returns the path of the log file.
 * @returns {string} The log file path.
 */
function logPath() {
    const logsDir = path.join(__dirname, '..' ,logsDirectory);
    const fileName = `${logsFilename}${logsExtension}`;
    return path.join(logsDir, fileName)
}

/**
Saves logs to the logs folder by appending the specified text to the end of the log file.
@param {string} text - The text to be added to the log file.
*/
function saveLog(text) {
    fs.appendFileSync(logPath(), `${text} \n\n*******\n\n`);
}

/**
* Saves the given solution to a file in the "suggestions" folder and returns the path to the created file.
* @param {string} solution - The solution to save to a file.
* @returns {string} - The path to the created file.
*/
function saveOutput(solution) {
    // Save the solution to a file in the "suggestions" folder
    const suggestionsDir = path.join(__dirname, '..' , outputFolder);
    const fileName = `${Date.now()}.patch`;
   
    // Write the suggestion to the file
    const filePath = path.join(suggestionsDir, fileName)
    fs.writeFileSync(filePath, `${solution}`);
    return filePath
}

module.exports= {
    saveOutput,
    saveLog,
    logPath
}