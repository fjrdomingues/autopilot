const { callAgent } = require('../agents/genericAgent');
const { jsonParseWithValidate } = require('../modules/jsonHelpers');

const promptTemplate =
` 
# USER INPUT - User Request
{task}

# YOUR TASK - What you need to do
Your task is to find relevant code from the source code. 
Replace the irrelevant code with "..." and reply with the rest

# RESPONSE FORMAT 
## This is the format of your reply. Ensure the response can be parsed by JSON.parse. Must be valid JSON
{{
    "thoughts":
    {{
        "text": "thought",
        "reasoning": "reasoning",
        "criticism": "constructive self-criticism",
        "speak": "thoughts summary to say to user"
    }},
    "output": {{
        "code": {{
            "copiedSourceCode": "extracted code from the file in string format",
            "reasoning": "reason this code was copied"
        }}
    }}
}}

# SOURCE CODE
## {filePath}
{fileCode}
`
/**
 * This function takes a task and a file object as input, and returns a relevant context
 * for the file by calling an agent with a prompt template and input values.
 * @param {string} task - The name of the task.
 * @param {object} file - An object containing the code and path of the file.
 * @param {string} file.code - The code of the file.
 * @param {string} file.path - The path of the file.
 * @returns {Promise<object>} - A Promise that resolves to an object containing the relevant context.
 * @throws {Error} - If the response from the agent cannot be parsed as JSON or does not match the expected schema.
 */
async function getRelevantContextForFile(task, file) {
    const values = {task:task, fileCode:file.code, filePath: file.path}
    const reply = await callAgent(promptTemplate, values, process.env.CODE_READER_MODEL);
    return jsonParseWithValidate(reply);
}

module.exports = getRelevantContextForFile