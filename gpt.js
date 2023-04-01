const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config()
// const wordCount = require('word-count');
const GPT_4_API_KEY = process.env.OPENAI_API_KEY;

const callGPT = async (prompt) => {
    console.log("calling GPT")
    // console.log("Prompt size is:", wordCount(prompt)*1.333)
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        // model: 'gpt-3.5-turbo',
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GPT_4_API_KEY}`
        }
      });
  
      const output = response.data.choices[0].message.content;
      console.log("Got GPT reply. Used ",chalk.yellow(response.data.usage.total_tokens)," tokens")
      return output

    } catch (error) {
      console.error(error.response.data);
    }
  };

  module.exports= {
    callGPT
  }