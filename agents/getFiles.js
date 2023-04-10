const { callAgent } = require('../agents/genericAgent');
const { jsonParseWithValidate } = require('../modules/gpt');

const promptTemplate =
` 
USER INPUT: {task}
YOUR TASK: Identify the files in the codebase that are relevant to the USER INPUT. Don't include new files. Also explain why the file is relevant.
OUTPUT: JSON - You must respond in JSON format as described below
RESPONSE FORMAT:
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
            "path": "path to relevant file",
            "reason": "reason why the file was selected"
        }}]
    }}
}}
Ensure the response can be parsed by JSON.parse    

CONTEXT:
*** START REPOSITORY CONTEXT ***
{summaries}
*** END REPOSITORY CONTEXT ***
`
async function getRelevantFiles(task, summaries) {
    const values = {task:task, summaries:summaries}
    const reply = await callAgent(promptTemplate, values, process.env.CHEAP_MODEL);

    const parsedReply = jsonParseWithValidate(reply)
    return parsedReply;
}

module.exports = getRelevantFiles