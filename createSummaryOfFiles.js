const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chokidar = require('chokidar');
const wordCount = require('word-count')
require('dotenv').config()

let totalTokensUsed = 0

const GPT_4_API_KEY = process.env.OPENAI_API_KEY;

const calculateProjectSize = (dir) => {
  let projectSize = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && file !== 'node_modules' && file !== 'aiDev') {
      projectSize += calculateProjectSize(filePath);
    } else if (path.extname(filePath) === '.js' || path.extname(filePath) === '.tsx') {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      projectSize += fileContent.length;
    }
  }

  return projectSize;
};


const processDirectory = async (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && file !== 'node_modules' && file !== 'aiDev') {
      await processDirectory(filePath);
    } else if (path.extname(filePath) === '.js' || path.extname(filePath) === '.tsx') {
      const file = fs.readFileSync(filePath, 'utf8')
      console.log(filePath, wordCount(file)*1.33)
      if (wordCount(file)*1.33 > 3500) {
        console.log('File too BIG')
        continue
      }
      await processFile(filePath);
    }
  }
};

const processFile = async (filePath) => {
  try {
    let fileContent = fs.readFileSync(filePath, 'utf-8');

    const prompt = `File:
\`\`\`
${fileContent}
\`\`\`
Task: Create a summary of this file using bullet points. Include:
- What the file does
- Name of all functions
- Most important variables
`

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      // model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GPT_4_API_KEY}`
      }
    });

    const output =  filePath + '\n' + response.data.choices[0].message.content;
    const tokens = response.data.usage.total_tokens

    totalTokensUsed += tokens
    console.log('Total tokens: ', totalTokensUsed, 'Total cost: ', totalTokensUsed*0.002/1000)

    
    if (output) {
        // Save new comment
        const summaryPath = path.join(path.dirname(filePath), path.basename(filePath, '.js') + '.ai.txt');
        fs.writeFileSync(summaryPath, output);
        const timestamp = new Date().toISOString();
        const hour = timestamp.match(/\d\d:\d\d/);

        console.log(`${hour}: Updated ${summaryPath}`);
    }
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
  }
};

async function main() {
  const directoryPath = process.argv[2] || process.cwd();
  const fullAnalysis = process.argv.includes('--all');

  // Calculate and display the project size
  const projectSize = calculateProjectSize(directoryPath);
  console.log(`Project size: ~${projectSize/4} tokens`);

  // Prompt the user to proceed
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question('Proceed with summarizing the project? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      // Process the initial directory
      if (fullAnalysis) await processDirectory(directoryPath);

      // Watch for file changes in the directory
      const watcher = chokidar.watch(directoryPath, {
        ignored: /node_modules|aiDev|helpers/,
        persistent: true,
        ignoreInitial: true,
      });

      // Process the modified file
      watcher.on('change', async (filePath) => {
        if (
          path.extname(filePath) === '.js' ||
          path.extname(filePath) === '.ts' ||
          path.extname(filePath) === '.tsx'
        ) {
          console.log(`File modified: ${filePath}`);
          await processFile(filePath);
        }
      });

      console.log('Watching for file changes...');
    } else {
      console.log('Aborted summarizing the project.');
    }
    readline.close();
  });
}


main();
