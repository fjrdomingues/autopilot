const { callGPT } = require('../modules/gpt');

async function suggestChanges(task, files) {
    // format code for prompt
    let code = '';
    files.forEach(file => {
        code += `// File: ${file.path}\n`;
      if (file.code.length > 0) {
        file.code.forEach(cs => {
          code += `\`\`\`// Code Relevance: ${cs.reason}\n`;
          code += `${cs.sourceCode}\`\`\`\n\n`;
        });
      }
    });


    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: You are a senior software developer. Do what is asked in the USER INPUT
RESPONSE FORMAT: reply with text and provide the necessary assets to accomplish the USER INPUT
SOURCE CODE - This is code from the existing codebase of this project:
*** SOURCE CODE START ***
${code}
*** SOURCE CODE END ***
`
  
    const reply = await callGPT(prompt, process.env.ADVANCED_MODEL);
  
    return reply;
}

module.exports = suggestChanges