const { callAgent } = require('../agents/genericAgent');
const { jsonParseWithValidate } = require('../modules/jsonHelpers');

const promptTemplate =
` 
USER INPUT: {task}
YOUR TASK: You are a project manager working in a software development project. Measure the complexity of doing the USER INPUT and decide if it's critical to breakdown the work into less complex JIRA tasks. Based on your assessment output the list of tasks. Tasks will be done by engineers
*** CONTEXT START ***
{summaries}
*** CONTEXT END ***

RESPONSE FORMAT: This is the format of your reply. Ensure the response can be parsed by JSON.parse. Must be valid JSON
{
    "thoughts":
    {
        "text": "thought",
        "reasoning": "reasoning",
        "criticism": "constructive self-criticism",
        "speak": "thoughts summary to say to user"
    },
    "output": {
        "taskList": [{
            "taskTitle": "Title of JIRA task",
            "taskDescription": "Description of JIRA task"
        }]
    }
}
Ensure the response can be parsed by JSON.parse in nodejs
`

/**
 * Calls an agent to determine the complexity of a task, given a set of summaries.
 * @param {Array} summaries - An array of summaries related to the task.
 * @param {Object} task - An object representing the task to be evaluated.
 * @returns {Promise<Object>} - A Promise that resolves to the result of the agent call, parsed as a JSON object.
 */
async function taskComplexityAgent(summaries, task) {
    const values = {task, summaries}
    const reply = await callAgent(promptTemplate, values, process.env.TASK_COMPLEXITY_MODEL);
    return jsonParseWithValidate(reply)
}

module.exports = taskComplexityAgent