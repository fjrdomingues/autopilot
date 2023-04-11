const fs = require('fs');
const path = require('path');
const outputFolder = 'suggestions';
const logsDirectory = 'logs';
const logsExtension = '.txt';
const logsFilename = new Date().toISOString().replace(/:/g, '-')

function logPath() {
    const logsDir = path.join(__dirname, '..' ,logsDirectory);
    const fileName = `${logsFilename}${logsExtension}`;
    return path.join(logsDir, fileName)
}

// Saves logs to logs folder
function saveLog(text) {
    fs.appendFileSync(logPath(), `${text} \n\n*******\n\n`);
}

// Saves output to suggestions
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