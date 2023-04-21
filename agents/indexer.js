const { callAgent } = require('../agents/genericAgent');

const promptTemplate = 
`
TASK: Create a summary of the file below. Use as few words as possible while keeping the details. Use bullet points
*** FILE CONTENT START ***
{fileContent}
*** FILE CONTENT END ***
`

/**
 * 
 * Generates a summary of the given file content by calling an external AI agent.
 * @param {string} fileContent - The content of the file to be summarized.
 * @returns {Promise<string>} A Promise that resolves to a string containing the summary of the file content.
 */
async function fileSummary(fileContent) {
    const values = {fileContent:fileContent}
    const reply = await callAgent(promptTemplate, values, process.env.INDEXER_MODEL);

    return reply;
}

module.exports = fileSummary