const { callAgent } = require('../agents/genericAgent');

const promptTemplate =
` 
USER INPUT: {task}
YOUR TASK: You are a senior software developer. Do what is asked in the USER INPUT
RESPONSE FORMAT: reply with text and provide the necessary assets to accomplish the USER INPUT
SOURCE CODE - This is code from the existing codebase of this project:
\`\`\`
{sourceCode}
\`\`\`
`

/**
 * Asynchronously suggests changes to a task's source code using an advanced model.
 * @param {string} task - The task to suggest changes for.
 * @param {string} sourceCode - The source code to suggest changes for.
 * @returns {Promise<string>} - A Promise that resolves with the suggested changes.
 */
async function suggestChanges(task, sourceCode) {
    const values = {task:task, sourceCode:sourceCode}
    const reply = await callAgent(promptTemplate, values, process.env.ADVANCED_MODEL);

    return reply;
}

module.exports = suggestChanges