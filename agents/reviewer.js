const { callGPT } = require('../modules/gpt');
const { jsonParseWithValidate } = require('../modules/jsonHelpers');


async function review(task, diff, criteria) {
    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: You are a senior software developer reviewing a patch. Your task is to evaluate if the PATCH DIFF solves the USER INPUT. Take into account the points in the "Evaluation Criteria"
Evaluation Criteria:
${criteria.map(c => "- " + c + '\n').join('')}

PATCH DIFF - This is the suggested patch to do the USER INPUT. Lines with a "-" were removed and lines with a "+" were added:
*** PATCH START ***
${diff}
*** PATCH END ***

RESPONSE FORMAT - This is the format of your reply. Ensure the response can be parsed by JSON.parse in nodejs. Response must be valid JSON:
{
    "thoughts":
    {
        "text": "thought",
        "reasoning": "reasoning",
        "criticism": "what could be improved in the patch",
    },
    "output": {
        "evaluation": {
            "summary": "summary of changes found",
            "changes": ["list of changes found"],
            "rating": evaluation from 1 to 10 (number),
            "reason": "reason for the evaluation"
        }
    }
}
`

    const reply = await callGPT(prompt, process.env.ADVANCED_MODEL);
    return jsonParseWithValidate(reply);
  }

module.exports = review