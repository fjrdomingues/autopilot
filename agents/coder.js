const { callAgent } = require('../agents/genericAgent');

function formatCode(file) {
  // format code for prompt
  let code = '';
  code += `### ${file.path}`;
  code += `\n`;
  code += '```';
  code += `\n`;
  code += `${file.code}`;
  code += `\n`;
  code += '```';
  code += `\n`;
  return code
}


/**
 * Currently the output of the agent is a string with the following format:
 * ## filename
 * ```
 * code
 * ```
 * This function removes the filename and the code block markers.
 * @param {string} res
 * @returns {string}
 * @description Removes the filename and the code block markers from the output of the agent.
 */
function cleanRes(res){
  let lines = res.split("\n");
  lines.shift(); // ## filename
  if (lines[0] === '' || lines[0] === '```') {
    lines.shift();
  }
  if (lines[lines.length - 1] === '' || lines[lines.length - 1] === '```') {
    lines.pop();
  }
  const resCleaned = lines.join("\n")
  return resCleaned
}

const promptTemplate = 
` 
# USER INPUT
{task}

# YOUR TASK
As a senior software developer, make the requested changes from the USER INPUT.

# RESPONSE FORMAT 
## This is the format of your reply. 
Provide a new version of the source code with the task complete.
Code only. No comments or other text. 

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
    const code = formatCode(file)
    const values = {task, code}
    const reply = await callAgent(promptTemplate, values, process.env.ADVANCED_MODEL);
    const cleanedReply = cleanRes(reply);

    return cleanedReply;
}

module.exports = suggestChanges