const { callAgent } = require('../agents/genericAgent');

const promptTemplate = 
`
TASK: Create a summary of the file below. Use as few words as possible while keeping the details. Use bullet points
*** FILE CONTENT START ***
{fileContent}
*** FILE CONTENT END ***
`

async function fileSummary(fileContent, model) {
    const values = {fileContent:fileContent}
    const reply = await callAgent(promptTemplate, values, model);

    return reply;
}

module.exports = fileSummary