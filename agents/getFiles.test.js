const { getRelevantFiles } = require('./getFiles');

describe('getRelevantFiles', () => {
  const { loadBaseConfig }=require('../modules/config');
  loadBaseConfig();

  const summaries = `
File Path: modules/gpt.js
Summary:
A module that exports two functions for calling OpenAI's GPT API and verifying the model used.
functions: callGPT,verifyModel
modelCostMap - A map that contains the cost of using different GPT models.
configuration - An object that contains the OpenAI API key.
openai - An object that contains the OpenAI API.

---
File Path: agents/coder.js
Summary:
Exports a function that asynchronously suggests changes to a task's source code using an advanced model.
functions: suggestChanges,formatCode
PromptTemplate - A class that generates a prompt from a template and input variables.
StructuredOutputParser - A class that parses structured output from a model.
OutputFixingParser - A class that fixes output from a model that does not conform to a schema.
getModel - A function that returns a model.
saveLog - A function that saves a log to a file.
formatCode - A function that formats the code from the given file object into a Markdown code block.

---
`;

  const testCases = [
    {
      task: 'Create a new file named: "newFILE.js"',
      expectedOutput: []
    },
    {
      task: 'in coder.js, create a new function called newFunction',
      expectedOutput: ['agents/coder.js']
    },
    {
      task: 'update the verifyModel function',
      expectedOutput: ['modules/gpt.js']
    },
    {
      task: 'Add license info to the top of all my files',
      expectedOutput: ['agents/coder.js', 'modules/gpt.js']
    }
  ];

  it.each(testCases)('%s', async ({ task, expectedOutput }) => {
    const relevantFiles = await getRelevantFiles(task, summaries);
    const actualPaths = relevantFiles.map((file) => file.path);
    expect(actualPaths).toEqual(expect.arrayContaining(expectedOutput));
  }, 600000);

});
