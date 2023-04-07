const { callGPT } = require('../modules/gpt');

async function suggestChanges(task, sourceCode) {

    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: You are a senior software developer. Do what is asked in the USER INPUT
RESPONSE FORMAT: reply with text and provide the necessary assets to accomplish the USER INPUT
SOURCE CODE - This is code from the existing codebase of this project:
\`\`\`
${sourceCode}
\`\`\`
`
  
    const reply = await callGPT(prompt, process.env.ADVANCED_MODEL);
  
    return reply;
}

module.exports = suggestChanges