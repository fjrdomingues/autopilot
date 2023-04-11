
const { callAgent } = require('../agents/genericAgent');

const promptTemplate = 
// PROMPT FOR CODER AGENT
` 
USER INPUT: {task}
YOUR TASK: As a senior software developer, make the requested changes from the USER INPUT.
Do NOT repeat the file name or path. 

COMMANDS:
Create a new File: "createFile", args: "path": "<path>", "content": "<source_code_to_write_on_file>"

RESPONSE FORMAT - This is the format of your reply. Provide a new version of the source code with the task complete in a JSON format.
{{
  "code": "source code",
  "explanation": "explanation for the changes made",
  "command": ""
}}

SOURCE CODE - This is provided in a markdown format as follows:
## /path/filename
\`\`\`\nsource code
\`\`\`\n
SOURCE CODE - Here are the relevant files and code from the existing codebase:
## {path}
\`\`\`\n{code}
\`\`\`\n` 

async function suggestChanges(task, file) {
  const values = {task, code: file.code, path: file.path}
  const reply = await callAgent(promptTemplate, values, process.env.ADVANCED_MODEL);
  
  return JSON.parse(reply);
}

module.exports = suggestChanges
