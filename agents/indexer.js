const { z } = require('zod');
const { PromptTemplate } = require('langchain/prompts');
const { StructuredOutputParser, OutputFixingParser } = require('langchain/output_parsers');
const { getModel } = require('../modules/model');

const promptTemplate = 
`
TASK: Create a summary of the file below. Use as few words as possible while keeping the details. Use bullet points.

{format_instructions}

{filePathRelative}
\`\`\`
{fileContent}
\`\`\`
`

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    thoughts: z.object({
      text: z.string().describe('your thoughts'),
      reasoning: z.string().describe('your reasoning'),
      criticism: z.string().describe('constructive self-criticism'),
    }),
    output: z.object({
      summary: z.string().describe('summary of the file content'),
      functions: z.array(z.string()).describe('functions in the file'),
      keywords: z.array(
        z.object({
          term: z.string().describe('the term'),
          definition: z.string().describe('explanation of the term in the code\'s context'),
        })
      ).describe('What are business-level terminologies and keywords we can learn from the code?'),
      dependenciesLibs: z.string().array().describe('what libraries and/or files does this file depend on?'),
    }),
  })
);

const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template: promptTemplate,
  inputVariables: ['filePathRelative', 'fileContent'],
  partialVariables: { format_instructions: formatInstructions },
});

/**
 * 
 * Generates a summary of the given file content by calling an external AI agent.
 * @param {string} fileContent - The content of the file to be summarized.
 * @returns {Promise<string>} A Promise that resolves to a string containing the summary of the file content.
 */
async function fileSummary(filePathRelative, fileContent) {
	const model = getModel(process.env.INDEXER_MODEL);

	const input = await prompt.format({ filePathRelative, fileContent });
	const response = await model.call(input);

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

  return parsedResponse.output;
}

module.exports = { fileSummary };