const { callGPT } = require('../modules/gpt');
const { jsonParseWithValidate } = require('../modules/jsonHelpers');

// TODO: convert to generic agent
/**
 * Performs a code review based on a given task and patch diff, according to the specified evaluation criteria.
 * @param {string} task - The user input task to be solved by the patch diff.
 * @param {string} diff - The suggested patch diff to be reviewed.
 * @param {string[]} criteria - The evaluation criteria to be taken into account during the review.
 * @returns {Object} - A response object containing the reviewer's thoughts and evaluation of the patch diff in a valid JSON format.
 */
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

    const reply = await callGPT(prompt, process.env.REVIEWER_MODEL);
    return jsonParseWithValidate(reply);
  }

module.exports = review