const { callGPT, jsonParseWithValidate } = require('../modules/gpt');

async function getRelevantContextForFile(task, file) {
    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: Find and extract the relevant source code on this file to solve the USER INPUT. Don't modify the code. Extract only if the code is relevant, otherwise ignore.

You must respond in JSON format as described below

RESPONSE FORMAT:
{
    "thoughts":
    {
        "text": "thought",
        "reasoning": "reasoning",
        "criticism": "constructive self-criticism",
        "speak": "thoughts summary to say to user"
    },
    "output": {
        "file": "filename and path of file",
        "relevantCode": [{
            "sourceCode": "extracted relevant code in string format",
            "reason": "reason this code was selected"
        }]
    }
}
Ensure the response can be parsed by JSON.parse in nodejs    

CONTEXT SOURCE CODE: 
*** CONTEXT SOURCE CODE START ***
// ${file.path}
${file.code}
*** CONTEXT SOURCE CODE END ***

`

    const reply = await callGPT(prompt, process.env.CHEAP_MODEL);
    return jsonParseWithValidate(reply);
  }

module.exports = getRelevantContextForFile