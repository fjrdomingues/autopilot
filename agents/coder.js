const { callGPT } = require('../modules/gpt');

async function suggestChanges(task, files) {
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


    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: As a senior software developer, make the requested changes from the USER INPUT.

RESPONSE FORMAT: Provide a patch in the following format, only showing modified lines. Do NOT include any additional formatting, such as JSON or triple backticks. Do NOT include explanations, comments, or any unchanged lines. Only include the modified lines:
diff --git a/example_file.txt b/example_file.txt
index abc123..def456 100644
@@ -3,1 +3,1 @@
-This line will be removed in the modified file
+This line is added in the modified file

SOURCE CODE: Here are the relevant files and code from the existing codebase:
*** SOURCE CODE START ***
${code}
*** SOURCE CODE END ***
`
  
    const reply = await callGPT(prompt, process.env.ADVANCED_MODEL);
  
    return reply;
}

module.exports = suggestChanges