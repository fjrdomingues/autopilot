const { callGPT } = require('../modules/gpt');

async function suggestChanges(task, sourceCode) {

    const prompt = 
` 
USER INPUT: ${task}
YOUR TASK: You are a senior software developer. Do what is asked in the USER INPUT.
RESPONSE FORMAT: A valid patch format with a code update based on the USER INPUT. Example format:
"
diff --git a/[file path] b/[file path]
index [old file hash]..[new file hash] [mode]
--- a/[file path]
+++ b/[file path]
@@ -[old line number],[old line number] +[new line number],[new line number] @@
 [changed lines]
"
Code only. Do not add explanations or comments.
SOURCE CODE - This is code from the existing codebase of this project:
\`\`\`
${sourceCode}
\`\`\`
`
  
    const reply = await callGPT(prompt, process.env.ADVANCED_MODEL);
    return reply;
}

module.exports = suggestChanges