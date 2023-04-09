const fs = require('fs');
const path = require('path');

// Saves output to suggestions
function saveOutput(task, solution) {
    // Save the solution to a file in the "suggestions" folder
    const suggestionsDir = path.join(__dirname, '..' , 'suggestions');
    const fileName = `${Date.now()}.md`;
   
    // Write the suggestion to the file
    const filePath = path.join(suggestionsDir, fileName)
    fs.writeFileSync(filePath, `# TASK \n ${task}\n# SOLUTION\n\`\`\`json\n${solution}\`\`\``);
    return filePath
}

module.exports= {
    saveOutput
}