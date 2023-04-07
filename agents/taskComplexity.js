const { callGPT } = require('../modules/gpt');

async function taskComplexityAgent(summaries, task) {
    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: You are a project manager working in a software development project. Measure the complexity of doing the USER INPUT and decide if it's critical to breakdown the work into less complex JIRA tasks. Based on your assessment write at least 1 task. Tasks will be done by engineers. Resources are limited so only divide tasks if crucial.
CONTEXT: 
\`\`\`
${summaries}
\`\`\`

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


    const reply = await callGPT(prompt, "gpt-3.5-turbo");
    return JSON.parse(reply)

}

module.exports = taskComplexityAgent