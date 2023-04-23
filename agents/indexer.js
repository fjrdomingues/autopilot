const { callAgent } = require('../agents/genericAgent');

const promptTemplate = 
`
# Your Role
Create a representation of the file below

# Output
## Reply with the following format
[A summary of the file]
[functionName(params)] - [Description of business logic]

# File
{fileContent}
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