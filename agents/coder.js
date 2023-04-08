const { callGPT } = require('../modules/gpt');

async function suggestChanges(task, sourceCode) {

    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: You are a senior software developer. Do what is asked in the USER INPUT.
RESPONSE FORMAT: A valid patch format --unified=0, as minimal as possible. Example format:
"
diff --git a/example_file.txt b/example_file.txt
index abc123..def456 100644
@@ -3,1 +3,1 @@
-This line will be removed in the modified file
+This line is added in the modified file
"
Code only. Do not add explanations or comments. Do NOT add any before or after lines. No old/original lines. Only the modified lines.
SOURCE CODE - This is code from the existing codebase of this project:
\`\`\`
${sourceCode}
\`\`\`
`
  
    const reply = await callGPT(prompt, process.env.ADVANCED_MODEL);
    return reply;
}

module.exports = suggestChanges