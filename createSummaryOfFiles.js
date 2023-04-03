const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chokidar = require('chokidar');
const wordCount = require('word-count')
const { callGPT } = require('./modules/gpt');
const ignoreList = ['node_modules', 'autopilot', 'coverage', 'public', '__tests__'];
require('dotenv').config()

const calculateProjectSize = (dir) => {
  let projectSize = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && !ignoreList.includes(file)) {
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

    if (stats.isDirectory() && !ignoreList.includes(file)) {
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
Task: Create a summary of this file, what it does and how it contributes to the overall project.
`
    const output = await callGPT(prompt)

    if (output) {
        // Save new comment
        const summaryPath = path.join(path.dirname(filePath), path.basename(filePath, '.js') + '.ai.txt');
        // adds filepath to top of summary
        const contentToRight = `File Path: ${filePath}\nSummary:\n${output}`
        fs.writeFileSync(summaryPath, contentToRight);
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
        ignored: /node_modules|autopilot|helpers/,
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
