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

async function fileSummary(fileContent, model) {
    const values = {fileContent:fileContent}
    const reply = await callAgent(promptTemplate, values, model);

    return reply;
}

module.exports = fileSummary