require('dotenv').config()
const { countTokens } = require('./tokenHelper')
const chalk = require('chalk');
const path = require('path');
const { parseFileContent } = require('./fsInput');
const { getDB, insertOrUpdateFile } = require('./db');

const summaryStringDelimiter = "\n---\n";
const maxSummaryTokenCount = 3000;
const maxTokenSingleFile = 3000;

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
  const summaryChunks = [];
  let currentChunk = "";
  let currentChunkLength = 0;
  summariesArray = summaries.split(summaryStringDelimiter);

  for (const summary of summariesArray) {
    const delimitedSummary = summary + summaryStringDelimiter;
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
 * Gets all .ai.txt files (summaries)
 * @param {boolean} test - If true, reads files only in the 'benchmarks' directory.
 * @returns {Promise<string>} A string containing all the summaries concatenated together.
 */
async function readAllSummaries(codeBaseDirectory) {
  const db = getDB(codeBaseDirectory);
  const sql = `
  SELECT path, summary 
  FROM files`;
  const summaries = await new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
  
  if (typeof summaries === 'undefined' || summaries.length === 0) {
    console.log("No matching files found in the database. Try running `node createSummaryOfFiles` first.");
    throw new Error("Cannot run without summaries. Try running `node createSummaryOfFiles` first.");
  }

  let summariesString = "";
  console.log("Summaries found in the database:", summaries.length);
  for (const summary of summaries) {
    try {
      summariesString += `File Path: ${summary.path}\nSummary:\n${summary.summary}${summaryStringDelimiter}`;
    } catch (error) {
      console.error("Error reading summary from database:", error);
    }
  }
  return summariesString;
}

/**
 * Fetches and validates summaries for a given test.
 * @param {boolean} test - Setting for internal tests.
 * @param {string} codeBaseDirectory - The directory to search for summaries.
 * @returns {Promise<Array<Summary>>} A Promise that resolves to an array of summary objects.
 */
async function getSummaries(codeBaseDirectory){
  const summaries = await readAllSummaries(codeBaseDirectory);
  const summariesTokenCount = countTokens(JSON.stringify(summaries))
  console.log(`Tokens in Summaries: ${chalk.yellow(summariesTokenCount)}`)

  return summaries
}


/**
 * Processes a file by generating a summary using the specified machine learning model
 * and writing the summary to a new file.
 * @param {string} codeBaseDirectory - The directory of the file being processed.
 * @param {string} filePathRelative - The relative path of the file being processed.
 * @param {string} fileContent - The content of the file being processed.
 * @param {object} model - The machine learning model used to generate the summary.
 */
async function generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent, model) {
  const fileSummary = require('../agents/indexer');

  const filePathFull = path.join(codeBaseDirectory, filePathRelative);
  const parsedFile = parseFileContent(codeBaseDirectory, filePathFull, fileContent);
  const fileTokensCount = parsedFile.fileTokensCount;

  console.log(`Processing file: ${filePathRelative}`);
  if (fileTokensCount > maxTokenSingleFile) {
    console.log(chalk.red('File too BIG'));
    return;
  }
  if (fileTokensCount == 0) {
    console.log(chalk.yellow('File Empty'));
    return;
  }

  try {
    const summary = await fileSummary(fileContent, model);

    if (summary) {
      insertOrUpdateFile(codeBaseDirectory, parsedFile, summary);

      // TODO: Use logging library that already adds timestamps
      const timestamp = new Date().toISOString();
      const hour = timestamp.match(/\d\d:\d\d/);
      console.log(`${hour}: Updated summary for ${filePathRelative}`);
    }
  } catch (error) {
    console.error(`Error processing file: ${filePathRelative}`, error);
  }
}

module.exports = {
    readAllSummaries,
    types,
    getSummaries,
    chunkSummaries,
    maxSummaryTokenCount,
    generateAndWriteFileSummary
}