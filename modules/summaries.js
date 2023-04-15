require('dotenv').config()
const countTokens = require('./tokenHelper')
const chalk = require('chalk');
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
Splits an array of summary strings into chunks up to a maximum size.
@param {string} summaries - An array of summary strings to chunk.
@param {number} maxChunkLength - The maximum length of each chunk.
@returns {string[]} An array of arrays, where each sub-array contains summary strings that are up to maxChunkLength characters long.
@throws {Error} If a single summary string is longer than maxChunkLength.
*/
function chunkSummaries(summaries, maxChunkLength) {
  const delimiter = "\n\n";
  const summaryChunks = [];
  let currentChunk = "";
  let currentChunkLength = 0;
  summariesArray = summaries.split(delimiter);

  for (const summary of summariesArray) {
    const delimitedSummary = summary + delimiter;
    const currentSummaryLength = countTokens(delimitedSummary);

    if (currentSummaryLength > maxChunkLength) {
      throw new Error('Single summary is too big');
    }

    if (currentChunkLength + currentSummaryLength > maxChunkLength) {
      summaryChunks.push(currentChunk);
      currentChunk = summary;
      currentChunkLength = currentSummaryLength;
    } else {
      currentChunkLength += currentSummaryLength;
      currentChunk += delimitedSummary;
    }
  }

  summaryChunks.push(currentChunk); // Push last chunk
  return summaryChunks;
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

/**
 * Gets all .ai.txt files (summaries)
 * @param {boolean} test - If true, reads files only in the 'benchmarks' directory.
 * @returns {Promise<string>} A string containing all the summaries concatenated together.
 */
async function readAllSummaries(dir, test) {
  const pattern = !test ? '**/*.ai.txt' : 'benchmarks/**/*.ai.txt'
  let files = [];
  try {
    console.log("Getting Summary");
    files = await fg(path.posix.join(dir, pattern), { ignore: ignorePattern });
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

/**
 * Fetches and validates summaries for a given test.
 * @param {boolean} test - Setting for internal tests.
 * @param {string} dir - The directory to search for summaries.
 * @returns {Promise<Array<Summary>>} A Promise that resolves to an array of summary objects.
 */
async function getSummaries(dir, test){
  const summaries = await readAllSummaries(dir, test);
  const summariesTokenCount = countTokens(JSON.stringify(summaries))
  console.log(`Tokens in Summaries: ${chalk.yellow(summariesTokenCount)}`)

  return summaries
}


/**
 * Processes a file by generating a summary using the specified machine learning model
 * and writing the summary to a new file.
 * @param {string} dir - The directory of the file being processed.
 * @param {string} filePathRelative - The relative path of the file being processed.
 * @param {string} fileContent - The content of the file being processed.
 * @param {object} model - The machine learning model used to generate the summary.
 */
async function generateAndWriteFileSummary(dir, filePathRelative, fileContent, model) {
  const fileSummary = require('./agents/indexer');

  try {
    const output = await fileSummary(fileContent, model);

    if (output) {
      const filePathFull = path.join(dir, filePathRelative);
      const summaryFilePath = path.join(filePathFull + '.ai.txt');
      const summaryFileContent = `File Path: ${filePathRelative}\nSummary:\n${output}`;
      fs.writeFileSync(summaryFilePath, summaryFileContent);
      const timestamp = new Date().toISOString();
      const hour = timestamp.match(/\d\d:\d\d/);

      console.log(`${hour}: Updated ${summaryFilePath}`);
    }
  } catch (error) {
    console.error(`Error processing file: ${filePathRelative}`, error);
  }
}
exports.generateAndWriteFileSummary = generateAndWriteFileSummary;
;


module.exports = {
    readAllSummaries,
    getFiles,
    types,
    getSummaries,
    chunkSummaries,
    maxSummaryTokenCount,
    generateAndWriteFileSummary
}