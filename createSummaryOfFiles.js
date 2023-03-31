const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chokidar = require('chokidar');
require('dotenv').config()


const GPT_4_API_KEY = process.env.OPENAI_API_KEY;

const processDirectory = async (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && file !== 'node_modules' && file !== 'helpers') {
      await processDirectory(filePath);
    } else if (path.extname(filePath) === '.js') {
      await processFile(filePath);
    }
  }
};

const processFile = async (filePath) => {
  try {
    let fileContent = fs.readFileSync(filePath, 'utf-8');

    const prompt = `I'm building a mental model to feed the context of an app's codebase to OpenAI GPT LLMs. Here is one file of the codebase:
\`\`\`
${fileContent}
\`\`\`
Output the context of this file. Help what the code does. Include what is necessary to understand the app to then assist the developer in coding the application. Having repeating yourself. Include:
- Functions with params and a description of what they do.
- Relevant variables
- Linked files/modules
`

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      // model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GPT_4_API_KEY}`
      }
    });

    const output = response.data.choices[0].message.content;

    
    if (output) {
        // Save new comment
        const summaryPath = path.join(path.dirname(filePath), path.basename(filePath, '.js') + '.ai.txt');
        fs.writeFileSync(summaryPath, output);
        const timestamp = new Date().toISOString();
        const hour = timestamp.match(/\d\d:\d\d/);

        console.log(`${hour}: Updated ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
  }
};

async function main() {
  const directoryPath = process.argv[2] || process.cwd();

  // Process the initial directory
  // await processDirectory(directoryPath);

  // Watch for file changes in the directory
  const watcher = chokidar.watch(directoryPath, {
    ignored: /node_modules|helpers/,
    persistent: true,
    ignoreInitial: true,
  });

  // Process the modified file
  watcher.on('change', async (filePath) => {
    if (path.extname(filePath) === '.js') {
      console.log(`File modified: ${filePath}`);
      await processFile(filePath);
      // console.log(`Summary updated for ${filePath}`);
    }
  });

  console.log('Watching for file changes...');
}

main();
