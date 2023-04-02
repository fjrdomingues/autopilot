const chalk = require('chalk');
require('dotenv').config()
const { Configuration, OpenAIApi } = require("openai");
let totalTokensUsed = 0
let defaultModel = "gpt-3.5-turbo"
// const MODEL = "gpt-4"

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const callGPT = async (prompt, model) => {
  const GPTModel = model ? model : defaultModel
  console.log("Calling GPT. Model: ", GPTModel)
  // console.log("Prompt size is:", wordCount(prompt)*1.333)
  try {
    const completion = await openai.createChatCompletion({
      model: GPTModel,
      messages: [{role: "user", content: prompt}],
    });

    // log usage
    totalTokensUsed += completion.data.usage.total_tokens; // increment total tokens used
    // console.log(`Tokens used: ${completion.data.usage.total_tokens}`);
    console.log(`Total tokens used: ${chalk.yellow(totalTokensUsed)}`); // log total tokens used
    // return output
    return completion.data.choices[0].message.content

  } catch (error) {
    console.log(error)
    console.error(error.completion.data);
  }
};

module.exports= {
  callGPT
}