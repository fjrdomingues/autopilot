const { callAgent } = require('./genericAgent');

function formatRelevantFiles(relevantFiles) {
  let result = ''
  for (const file of relevantFiles) {
    result += '### ' + file.path + '\n'
    result += file.task + '\n'
  }
  return result
}

const promptTemplate = 
` 
# TASK
## Original user input
{task}
## Plan, per file, to solve the task
{relevantFiles}
## What needs to be implement on this file
{fileTask}

# YOUR ROLE
Explain what needs to change in this file to implement the task. Include code snippets if you have them.

# SOURCE CODE 
## This is provided in a markdown format as follows:
### /path/filename
\`\`\`language
code
\`\`\`
Here is the relevant file and code from the existing codebase:
### {path}
{code}
` 

/**
 * Asynchronously suggests changes to a task's source code using an advanced model.
 * @param {string} task - The task to suggest changes for.
 * @param {} file - A file to apply code to.
 * @returns {Promise<string>} - A Promise that resolves with the suggested changes.
 */
async function suggestChanges(task, payload) {
  const relevantFiles = formatRelevantFiles(payload.relevantFiles)
  const file = payload.file
  const {code, task: fileTask, reason, path} = file
  const values = {task, code, fileTask, reason, path, relevantFiles}
  const reply = await callAgent(promptTemplate, values, process.env.ADVANCED_MODEL);
  return reply;
}

module.exports = suggestChanges