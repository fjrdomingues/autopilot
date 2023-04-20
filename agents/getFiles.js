const { callAgent } = require('../agents/genericAgent');
const { jsonParseWithValidate } = require('../modules/jsonHelpers');

const promptTemplate =
` 
USER INPUT: {task}
YOUR TASK: Identify the files where we are going to implement the USER INPUT. Don't include new files. Also explain why the file was selected.
OUTPUT: JSON - You must respond in JSON format as described below
{{
    "thoughts":
    {{
        "text": "thought",
        "reasoning": "reasoning",
        "criticism": "constructive self-criticism",
        "speak": "thoughts summary to say to user"
    }},
    "output": {{
        "relevantFiles": [{{
            "path": "path to file",
            "reason": "reason why the file was selected",
            "task": "what we'll implement in this file"
        }}]
    }}
}}  
CONTEXT:
*** START REPOSITORY CONTEXT ***
{summaries}
*** END REPOSITORY CONTEXT ***
`
/**
 * Asynchronously calls an agent with specified inputs to obtain relevant files.
 * @param {string} task - The task to be performed.
 * @param {Array<string>} summaries - An array of summaries relevant to the task.
 * @returns {Promise<Array<string>>} - A promise that resolves with an array of relevant file paths.
 * @throws {Error} - If the agent reply cannot be parsed as valid JSON.
 */
async function getRelevantFiles(task, summaries) {
    const values = {task:task, summaries:summaries}
    const reply = await callAgent(promptTemplate, values, process.env.GET_FILES_MODEL);

    const parsedReply = jsonParseWithValidate(reply)
    return parsedReply;
}

module.exports = getRelevantFiles