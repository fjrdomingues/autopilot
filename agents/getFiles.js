const { z } = require('zod');
const { PromptTemplate } = require('langchain/prompts');
const { StructuredOutputParser, OutputFixingParser } = require('langchain/output_parsers');
const { getModel } = require('../modules/model');
const { saveLog } = require('../modules/fsOutput');

const promptTemplate = `USER INPUT: {task}
YOUR TASK: 
Identify the minimal set of existing files, from the provided context bellow, to read based on the USER INPUT. 
Also explain why the file was selected.

{format_instructions}

CONTEXT:
*** START REPOSITORY CONTEXT ***
{summaries}
*** END REPOSITORY CONTEXT ***
`;

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    thoughts: z.object({
      text: z.string().describe('your thoughts'),
      reasoning: z.string().describe('your reasoning'),
      criticism: z.string().describe('constructive self-criticism'),
      speak: z.string().describe('summary of your thoughts to say to user'),
    }),
    output: z.object({
      relevantFiles: z.array(
        z.object({
          path: z.string().describe('path to file'),
          reason: z.string().describe('reason why the file was selected'),
          task: z.string().describe('what will be implemented in this file'),
        })
      ).describe('relevant files to implement the user input'),
    }),
  })
);

const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template: promptTemplate,
  inputVariables: ['task', 'summaries'],
  partialVariables: { format_instructions: formatInstructions },
});


/**
 * Given a task and some summaries, returns a list of relevant files along with reasons why they were selected.
 * 
 * @param task - The task to be performed
 * @param summaries - A summary of the relevant context
 * @returns {Promise<Array<{
 *   path: string,      // The path to the relevant file.
 *   reason: string,    // The reason why the file was selected.
 *   task: string,      // The task that will be implemented in this file.
 * }>>>}                // An array of relevant files for the given task.
 */
async function getRelevantFiles(task, summaries) {
	const model = getModel(process.env.GET_FILES_MODEL);

	const input = await prompt.format({ task, summaries });
  console.log(input)
  saveLog(`getFiles agent INPUT:\n${input}`)

	const response = await model.call(input);
  saveLog(`getFiles agent OUTPUT:\n${response}`)

	let parsedResponse
	try {
		parsedResponse = await parser.parse(response);
	} catch (e){
		const fixParser = OutputFixingParser.fromLLM(
			model,
			parser
		);
		parsedResponse = await fixParser.parse(response);
	}
	return parsedResponse.output.relevantFiles;
}

module.exports = { getRelevantFiles };