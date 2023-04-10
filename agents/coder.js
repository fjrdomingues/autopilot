const { callAgent } = require('../agents/genericAgent');

function formatCode(files) {
  // format code for prompt
  let code = '';
  files.forEach(file => {
      code += `// File: ${file.path}\n`;
    if (file.code.length > 0) {
      file.code.forEach(cs => {
        code += `// Code Relevance: ${cs.reason}\n`;
        code += `${cs.sourceCode}\n\n`;
      });
    }
  });
  return code
}

const promptTemplate = 
` 
USER INPUT: {task}
YOUR TASK: As a senior software developer, make the requested changes from the USER INPUT.

RESPONSE FORMAT: Provide a patch in the following format, only showing modified lines. Do NOT include any additional formatting, such as JSON or triple backticks. Do NOT include explanations, comments, or any unchanged lines. Only include the modified lines:
diff --git a/example_file.txt b/example_file.txt
index abc123..def456 100644
@@ -3,1 +3,1 @@
-This line will be removed in the modified file
+This line is added in the modified file

SOURCE CODE: Here are the relevant files and code from the existing codebase:
*** SOURCE CODE START ***
{code}
*** SOURCE CODE END ***

RESPONSE FORMAT: This is the format of your reply. Provide a patch in the following format, only showing modified lines. Do NOT include any additional formatting, such as JSON or triple backticks. Do NOT include explanations, comments, or any unchanged lines. Only include the modified lines:
diff --git a/example_file.txt b/example_file.txt
index abc123..def456 100644
@@ -3,1 +3,1 @@
-This line will be removed in the modified file
+This line is added in the modified file
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