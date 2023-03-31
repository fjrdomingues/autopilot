const axios = require('axios');
require('dotenv').config()
const GPT_4_API_KEY = process.env.OPENAI_API_KEY;

const callGPT = async (prompt) => {
    console.log("calling GPT")
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        // model: 'gpt-3.5-turbo',
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GPT_4_API_KEY}`
        }
      });
  
      const output = response.data.choices[0].message.content;
      console.log("Got GPT reply")
      return output

    } catch (error) {
      console.error(error);
    }
  };

  module.exports= {
    callGPT
  }