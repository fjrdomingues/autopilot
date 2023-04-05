const chalk = require('chalk');
require('dotenv').config()
const { Configuration, OpenAIApi } = require("openai");
let totalTokensUsed = 0
let completionTokens = 0
let promptTokens = 0
let cost = 0
let defaultModel = "gpt-3.5-turbo"
let GPT4Mode = false

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const callGPT = async (prompt, model) => {
  let GPTModel = model ? model : defaultModel
  if (GPT4Mode) GPTModel = 'gpt-4'
  console.log("Calling GPT. Model: ", GPTModel)
  // console.log("Prompt size is:", wordCount(prompt)*1.333)
  try {
    const completion = await openai.createChatCompletion({
      model: GPTModel,
      messages: [{role: "user", content: prompt}],
    });

    const usage = completion.data.usage

    // log usage
    totalTokensUsed += usage.total_tokens; // increment total tokens used
    completionTokens += usage.completion_tokens || 0
    promptTokens += usage.prompt_tokens || 0
    cost = calculateTokensCost(GPTModel, promptTokens, completionTokens, totalTokensUsed)
    console.log(`Total tokens used: ${chalk.yellow(totalTokensUsed)}`, `Total Cost: ${chalk.yellow(cost.toFixed(2))}$`) // log total tokens used



    // return output
    return completion.data.choices[0].message.content

  } catch (error) {
    console.log(error)
  }
};

const modelCostMap = {
  "gpt-4": {"promptTokensCost": 0.03, "completionTokensCost": 0.06},
  "gpt-3.5-turbo": {"tokensCost": 0.002},
};

function calculateTokensCost(model, promptTokens, completionTokens, totalTokensUsed) {
  if (model === "gpt-4") {
    return completionTokens * modelCostMap[model]["completionTokensCost"] / 1000 + promptTokens * modelCostMap[model]["promptTokensCost"] / 1000;
  } else {
    return totalTokensUsed * modelCostMap[model]["tokensCost"] / 1000;
  }
}

module.exports= {
  callGPT
}
