const chalk = require('chalk');
require('dotenv').config()
const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
const path = require('path');
const { get_encoding } = require('@dqbd/tiktoken');
let totalTokensUsed = 0
let completionTokens = 0
let promptTokens = 0
let cost = 0
const logsFilename = new Date().toISOString()

const modelCostMap = {
  "gpt-4": {"promptTokensCost": 0.03, "completionTokensCost": 0.06},
  "gpt-3.5-turbo": {"tokensCost": 0.002},
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const callGPT = async (prompt, model) => {
  if(!model) throw new Error('Model parameter is required')
  console.log("Calling GPT. Model: ", model)
  log(`Model: ${model}\nPrompt:\n${prompt}`)
  try {
    const completion = await openai.createChatCompletion({
      model: model,
      messages: [{role: "user", content: prompt}],
      temperature: 0.2
    });

    const usage = completion.data.usage

    // log usage
    totalTokensUsed += usage.total_tokens; // increment total tokens used
    completionTokens += usage.completion_tokens || 0
    promptTokens += usage.prompt_tokens || 0
    cost = calculateTokensCost(model, promptTokens, completionTokens, totalTokensUsed)
    console.log(`Total tokens used: ${chalk.yellow(totalTokensUsed)}`, `Total Cost: ${chalk.yellow(cost.toFixed(2))}$`) // log total tokens used

    const reply = completion.data.choices[0].message.content
    log("Reply:\n" + reply)
    // return output
    return reply

  } catch (error) {
    console.log(error.response)
  }
};

// counts tokens using tiktoken
function countTokens(input) {
  const encoder = get_encoding("cl100k_base")
  const tokens = encoder.encode(input);
  const tokenCount = tokens.length;
  encoder.free();
  return tokenCount;
}

function calculateTokensCost(model, promptTokens, completionTokens, totalTokensUsed) {
  if (model === "gpt-4") {
    return completionTokens * modelCostMap[model]["completionTokensCost"] / 1000 + promptTokens * modelCostMap[model]["promptTokensCost"] / 1000;
  } else {
    return totalTokensUsed * modelCostMap[model]["tokensCost"] / 1000;
  }
}

// Save logs of all GPT calls
function log(text) {
  const suggestionsDir = path.join(__dirname, '..' ,'logs');
  const fileName = `${logsFilename}.txt`;
  // Ensure folder exists
  if (!fs.existsSync(suggestionsDir)) {
    fs.mkdirSync(suggestionsDir);
  }
  // Write the suggestion to the file
  fs.appendFileSync(path.join(suggestionsDir, fileName), `${text} \n\n*******\n\n`);
 }

module.exports= {
  callGPT,
  calculateTokensCost,
  countTokens
}
