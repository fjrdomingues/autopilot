const { callGPT, jsonParseWithValidate } = require('../modules/gpt');

async function getRelevantFiles(task, summaries) {
    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: Identify the files in the codebase that are relevant to the USER INPUT. Don't include new files. Also explain why the file is relevant.
OUTPUT: JSON - You must respond in JSON format as described below
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
        "relevantFiles": [{
            "path": "path to relevant file",
            "reason": "reason why the file was selected"
        }]
    }
}
Ensure the response can be parsed by JSON.parse    

CONTEXT:
<start context>
${summaries}
<end context>
`
    const reply = await callGPT(prompt, process.env.CHEAP_MODEL);
    const parsedReply = jsonParseWithValidate(reply)
    return parsedReply.output.relevantFiles;
  }

  module.exports = getRelevantFiles