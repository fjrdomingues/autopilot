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

async function getRelevantContextForFile(task, file) {
    const values = {task:task, fileCode:file.code, filePath: file.path}
    const reply = await callAgent(promptTemplate, values, process.env.CHEAP_MODEL);
    return jsonParseWithValidate(reply);
  }

module.exports = getRelevantContextForFile