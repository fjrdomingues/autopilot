const { callAgent } = require('../agents/genericAgent');
const { jsonParseWithValidate } = require('../modules/jsonHelpers');

const promptTemplate =
` 
USER INPUT: {task}
YOUR TASK: Find and extract the relevant source code on this file to solve the USER INPUT. Don't modify the code. Extract only if the code is relevant, otherwise ignore.
RESPONSE FORMAT: This is the format of your reply. Ensure the response can be parsed by JSON.parse. Must be valid JSON
{{
    "thoughts":
    {{
        "text": "thought",
        "reasoning": "reasoning",
        "criticism": "constructive self-criticism",
        "speak": "thoughts summary to say to user"
    }},
    "output": {{
        "relevantCode": [{{
            "sourceCode": "extract code from the file in string format",
            "reason": "reason this code was selected"
        }}]
    }}
}}
CONTEXT SOURCE CODE: 
*** CONTEXT SOURCE CODE START ***
// {filePath}
{fileCode}
*** CONTEXT SOURCE CODE END ***

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