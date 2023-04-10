const fs = require('fs');
const path = require('path');
const outputFolder = 'suggestions';
const logsDirectory = 'logs';
const logsExtension = '.txt';
const logsFilename = new Date().toISOString().replace(/:/g, '-')

// Saves logs to logs folder
function saveLog(text) {
    const logsDir = path.join(__dirname, '..' ,logsDirectory);
    const fileName = `${logsFilename}${logsExtension}`;
    fs.appendFileSync(path.join(logsDir, fileName), `${text} \n\n*******\n\n`);
}

// Saves output to suggestions
function saveOutput(task, solution) {
    // Save the solution to a file in the "suggestions" folder
    const suggestionsDir = path.join(__dirname, '..' , outputFolder);
    const fileName = `${Date.now()}.md`;
   
    // Write the suggestion to the file
    const filePath = path.join(suggestionsDir, fileName)
    fs.writeFileSync(filePath, `# TASK \n ${task}\n# SOLUTION\n\`\`\`json\n${solution}\`\`\``);
    return filePath
}

module.exports= {
    saveOutput,
    saveLog
}