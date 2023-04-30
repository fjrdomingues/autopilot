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
# YOUR ROLE
Explain how to solve the task. A person will read your output and act based on your suggestions.
Take into consideration that user inputs can be questions, code changes, reports of bugs or others. Reply accordingly.
Another agent will look into the other files, your answer should focus on this file only. If there's nothing important to do on this file, keep your answer short or skip it.

# Task
## Original user input
{task}
## Relevant files - Plan, per file, to solve the task
{relevantFiles}
## Plan for this file
{fileTask}

# Source code of this file
### {path}
\`\`\`
{code}
\`\`\`
` 

/**
 * Asynchronously suggests changes to a task's source code using an advanced model.
 * @param {string} task - The task to suggest changes for.
 * @param {} file - A file to apply code to.
 * @returns {Promise<string>} - A Promise that resolves with the suggested changes.
 */
async function ChangesAdvice(task, payload) {
  const relevantFiles = formatRelevantFiles(payload.relevantFiles)
  const file = payload.file
  const {code, task: fileTask, reason, path} = file
  const values = {task, code, fileTask, reason, path, relevantFiles}
  const reply = await callAgent(promptTemplate, values, process.env.CODER_MODEL);
  return reply;
}

module.exports = { ChangesAdvice }