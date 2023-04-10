const { callAgent } = require('../agents/genericAgent');
const { jsonParseWithValidate } = require('../modules/gpt');

const promptTemplate =
`
USER INPUT: {task}
YOUR TASK: Extract the relevant parts of source code for the USER INPUT. Don't modify the code

You must respond in JSON format as described below

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
        "relevantCode": [{{
            "sourceCode": "extract code from the file in string format",
            "reason": "reason this code was selected"
        }}]
    }}
}}
Ensure the response can be parsed by JSON.parse in nodejs    

CONTEXT SOURCE CODE: 
\`\`\`
{file_code}
\`\`\`
`

async function getRelevantContextForFile(task, file) {
    const values = {task:task, file_code:file.code}
    const reply = await callAgent(promptTemplate, values, process.env.CHEAP_MODEL);
    return jsonParseWithValidate(reply).output.relevantCode;
  }

module.exports = getRelevantContextForFile