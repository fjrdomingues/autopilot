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
function saveOutput(solutions) {
    // Save the solution to a file in the "suggestions" folder
    const suggestionsDir = path.join(__dirname, '..' , outputFolder);
    const fileName = `${Date.now()}.patch`;
   
    const filePath = path.join(suggestionsDir, fileName)
    // Get solutions from array and format to save
    let content 
    solutions.map(file => {
        content += "File: " + file.file
        content += "\n"
        content += file.code
    })

    fs.writeFileSync(filePath, content);
    return filePath
}

/**
 *
 * @param {string} filePath - The path to the file to be updated.
 * @param {string} content - The new contents of the file.
 * @description Updates the file at filePath with the contents of content.
 */
function updateFile(filePath, content) {
    fs.writeFileSync(filePath, content, { flag: 'w' }, (err) => {
        if (err) {
        console.error(err);
        throw new Error("Error writing file" + err);
        }
        console.log(`The file ${filePath} has been updated.`);
    });
}

module.exports= {
    saveOutput,
    saveLog,
    logPath,
    updateFile
}