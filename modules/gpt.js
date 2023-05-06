const chalk = require('chalk');
const { Configuration, OpenAIApi } = require("openai");
const {saveLog} = require('./fsOutput');

let totalTokensUsed = 0
let completionTokens = 0
let promptTokens = 0
let cost = 0

const modelCostMap = {
  "gpt-4": {"promptTokensCost": 0.03, "completionTokensCost": 0.06},
  "gpt-3.5-turbo": {"tokensCost": 0.002},
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function verifyModel(model) {
  return modelCostMap.hasOwnProperty(model);
}

const callGPT = async (prompt, model) => {
  if (!model) throw new Error('Model parameter is required')
  if (!verifyModel(model)) {
    throw new Error('Invalid model');
  }

  console.log("Calling GPT. Model: ", model)
  saveLog(`Model: ${model}\nPrompt:\n${prompt}`)
  try {
    const completion = await openai.createChatCompletion({
      model: model,
      messages: [{role: "user", content: prompt}],
      temperature: parseFloat(process.env.MODEL_TEMPERATURE),
      presence_penalty: parseFloat(process.env.MODEL_PRESENCE_PENALTY),
      frequency_penalty: parseFloat(process.env.MODEL_FREQUENCY_PENALTY),
      user: process.env.MODEL_USER,
    });

    const usage = completion.data.usage

    // log usage
    totalTokensUsed += usage.total_tokens; // increment total tokens used
    completionTokens += usage.completion_tokens || 0
    promptTokens += usage.prompt_tokens || 0
    cost = calculateTokensCost(model, promptTokens, completionTokens, totalTokensUsed)
    console.log(`Total tokens used: ${chalk.yellow(totalTokensUsed)}`, `Total Cost: ${chalk.yellow(cost.toFixed(2))}$`) // log total tokens used

    const reply = completion.data.choices[0].message.content
    saveLog("Reply:\n" + reply)
    // return output
    return reply

  } catch (error) {
    console.log(error.response)
  }
};

function calculateTokensCost(model, promptTokens, completionTokens, totalTokensUsed) {
  if (model === "gpt-4") {
    return completionTokens * modelCostMap[model]["completionTokensCost"] / 1000 + promptTokens * modelCostMap[model]["promptTokensCost"] / 1000;
  } else {
    return totalTokensUsed * modelCostMap[model]["tokensCost"] / 1000;
  }
}


module.exports= {
  callGPT,
  calculateTokensCost
}
