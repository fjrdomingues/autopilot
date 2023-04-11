const { callAgent } = require('../agents/genericAgent');

function formatCode(files) {
  // format code for prompt
  let code = '';
  files.forEach(file => {
    code += `## ${file.path}`;
    code += `\n`;
    code += '```';
    code += `\n`;
    code += `${file.code}`;
    code += `\n`;
    code += '```';
    code += `\n`;
  });
  return code
}

const promptTemplate = 
` 
USER INPUT: {task}
YOUR TASK: As a senior software developer, make the requested changes from the USER INPUT.

RESPONSE FORMAT: This is the format of your reply. 
Provide a new version of the source code with the task complete.
Code only. No comments or other text. 
Do NOT repeat the file name or path. 
Do NOT include the triple backticks (\`\`\`) that surround the code.

SOURCE CODE: 
This is provided in a markdown format as follows:
## /path/filename
\`\`\`
code
\`\`\`
Here are the relevant files and code from the existing codebase:
{code}
` 

/**
 * Asynchronously suggests changes to a task's source code using an advanced model.
 * @param {string} task - The task to suggest changes for.
 * @param {Array} files - List of files to apply code to.
 * @returns {Promise<string>} - A Promise that resolves with the suggested changes.
 */
async function suggestChanges(task, files) {
    const code = formatCode(files)
    console.log(code)
    const values = {task, code}
    const reply = await callAgent(promptTemplate, values, process.env.ADVANCED_MODEL);

    return reply;
}

module.exports = suggestChanges