const { countTokens } = require('./tokenHelper');
require('dotenv').config()

const fs = require('fs');
const fg = require('fast-glob');
const path = require('path');
const ignorePattern = process.env.IGNORE_LIST.split(',');
const maxSummaryTokenCount = 3000;

const types = {
  FileObject: {
    path: "string",
    code: "string",
  },
};

/**
* Validates the number of tokens in a summary against a maximum limit.
* @param {number} summariesTokenCount - The number of tokens in the summary.
* @throws {Error} If the number of tokens exceeds the maximum allowed limit.
*/
function validateSummaryTokenCount(summariesTokenCount){
  if (summariesTokenCount > maxSummaryTokenCount) {
    message = `Aborting. Too many tokens in summaries. ${chalk.red(summariesTokenCount)} Max allowed: ${chalk.red(maxSummaryTokenCount)}`
    console.log(message)
    throw new Error(message)
  }
}

/**
 * @param {FileObject[]} files - An array of file objects, each with a `path` property.
 * @returns {FileObject[]} - An array of file objects, each with a `path` property and a `code` property containing the file's contents.
 */
function getFiles(files){
  let retFiles=[]
  for (const file of files) {
    const pathToFile = file.path;
    const fileContent = fs.readFileSync(pathToFile, 'utf8');
    file.code = fileContent
    retFiles.push(file)
  }
  return retFiles
}

// Gets all .ai.txt files (summaries)
// @param {boolean} test - If true, reads files only in the 'benchmarks' directory.
// @returns {Promise<string>} A string containing all the summaries concatenated together.
async function readAllSummaries(test) {
  const pattern = !test ? '**/*.ai.txt' : 'benchmarks/**/*.ai.txt'
  let files = [];
  try {
    console.log("Getting Summary");
    files = await fg(path.posix.join(process.env.CODE_DIR, pattern), { ignore: ignorePattern });
  } catch (err) {
    console.error("Error in fast-glob:", err);
    throw err;
  }

  if (files.length === 0) {
    console.log("No matching files found. Try running `node createSummaryOfFiles` first.");
    throw new Error("Can not run without Summaries. Try running `node createSummaryOfFiles` first.");
  }

  let summaries = "";
  console.log("Files found:", files);
  for (const file of files) {
    try {
      const summary = fs.readFileSync(file, 'utf-8');
      summaries += summary + '\n\n';
    } catch (error) {
      console.error("Error reading file:", file, error);
    }
  }
  return summaries;
}

// Summaries fetch and validate
// Returns a Promise that resolves to an array of summary objects
// @param {string} test - The test to retrieve summaries for
// @returns {Promise<Array<Summary>>}
async function getSummaries(test){
  const summaries = await readAllSummaries(test);
  const summariesTokenCount = countTokens(JSON.stringify(summaries))
  validateSummaryTokenCount(summariesTokenCount);
  console.log(`Tokens in Summaries: ${chalk.yellow(summariesTokenCount)}`)

  return summaries
}

module.exports = {
    readAllSummaries,
    getFiles,
    types,
    getSummaries
}