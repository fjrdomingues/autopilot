const { callGPT, jsonParseWithValidate } = require('../modules/gpt');

async function taskComplexityAgent(summaries, task) {
    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: You are a project manager working in a software development project. Measure the complexity of doing the USER INPUT and decide if it's critical to breakdown the work into less complex JIRA tasks. Based on your assessment output the list of tasks. Tasks will be done by engineers
*** CONTEXT START ***
${summaries}
*** CONTEXT END ***

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
        "taskList": [{
            "taskTitle": "Title of JIRA task",
            "taskDescription": "Description of JIRA task"
        }]
    }
}
Ensure the response can be parsed by JSON.parse in nodejs    
`


    const result = await callGPT(prompt, process.env.CHEAP_MODEL)
    return jsonParseWithValidate(result)

}

module.exports = taskComplexityAgent