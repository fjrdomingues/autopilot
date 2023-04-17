const { callAgent } = require('./genericAgent');

// This will be an array of files with an array of relevant code
function formatCode(files) {
  let code = '';
  let reason
  let task
  for (const file of files) {
    code += `### ${file.path}`;
    code += `\n`;

    for (const code of file.relevantCode) {
      code += '```';
      code += `\n`;
      code += `${code}`;
      code += `\n`;
      code += '```';
      code += `\n`;
    }
  }
  return code
}

const promptTemplate = 
` 
# TASK
## Original user input
{task}
{reason}
{fileTask}

# YOUR ROLE
Explain what needs to change in this file to implement the TASK

# SOURCE CODE 
## This is provided in a markdown format as follows:
### /path/filename
\`\`\`
code
\`\`\`
Here is the relevant file and code from the existing codebase:
{code}
` 

/**
 * Asynchronously suggests changes to a task's source code using an advanced model.
 * @param {string} task - The task to suggest changes for.
 * @param {} file - A file to apply code to.
 * @returns {Promise<string>} - A Promise that resolves with the suggested changes.
 */
async function suggestChanges(task, file) {
  const {code, task: fileTask, reason} = file
  const values = {task, code, fileTask, reason}
  const reply = await callAgent(promptTemplate, values, process.env.ADVANCED_MODEL);
  return reply;
}

module.exports = suggestChanges