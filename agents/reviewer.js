const { callGPT, jsonParseWithValidate } = require('../modules/gpt');

async function review(task, context, result) {
    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: You are a senior software developer reviewing a patch. Your task is to evaluate the PATCH taking into account the USER INPUT and CONTEXT. reply with an evaluation of the PATCH to solve the USER INPUT to the current SOURCE CODE. Also evaluate the output format.
SOURCE CODE - This is code from the existing codebase of this project:
*** SOURCE CODE START ***
${context}
*** SOURCE CODE END ***

PATCH - This is the suggested patch to do the USER INPUT. It is important that the patch includes only the correct syntax.
*** PATCH START ***
${result}
*** PATCH END ***

RESPONSE FORMAT - This is the format of your reply. Ensure the response can be parsed by JSON.parse in nodejs. Response must be valid JSON.
*** RESPONSE FORMAT START ***
{
    "thoughts":
    {
        "text": "thought",
        "reasoning": "reasoning",
        "criticism": "constructive self-criticism",
        "speak": "thoughts summary to say to user"
    },
    "output": {
        "evaluation": {
            "rating": evaluation from 1 to 10 (number),
            "reason": "reason for the evaluation"
        }
    }
}
*** RESPONSE FORMAT END ***
`

    const reply = await callGPT(prompt, process.env.ADVANCED_MODEL);
    return jsonParseWithValidate(reply);
  }

module.exports = review