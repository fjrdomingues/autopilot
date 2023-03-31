const fs = require('fs');
const readline = require('readline');


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function readAllSummaries() {
  // This function reads all summary files and returns an array of summaries
  // Here, we assume that summary files have the extension .ai.txt
  return new Promise((resolve, reject) => {
    glob("**/*.ai.txt", (err, files) => {
      if (err) {
        reject(err);
      } else {
        const summaries = files.map(file => fs.readFileSync(file, 'utf-8'));
        resolve(summaries);
      }
    });
  });
}

async function suggestChanges() {
  const summaries = await readAllSummaries();
  // Use AI or any other logic to analyze summaries and provide suggestions
  // For now, we'll just print the summaries
  console.log('Summaries:', summaries);
}

rl.question('What is the task you want to implement? ', task => {
  console.log(`You want to implement: ${task}`);
  rl.close();

  // Call the suggestChanges function to analyze summaries and provide suggestions
  suggestChanges();
});
