const { countTokens } = require('./tokenHelper')
const chalk = require('chalk');
const path = require('path');
const { parseFileContent } = require('./fsInput');
const { getDB, insertOrUpdateFile } = require('./db');

const summaryStringDelimiter = "\n---\n";

function getMaxTokenSingleFile(){
  return process.env.MAX_TOKEN_COUNT_SINGLE_FILE;
}

function getMaxSummaryTokenCount(){
  return process.env.MAX_TOKEN_COUNT_SUMMARIES_CHUNK;
}

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
  maxChunkLength = parseInt(maxChunkLength);
  const summaryChunks = [];
  let currentChunk = "";
  summariesArray = summaries.split(summaryStringDelimiter);

  for (const summary of summariesArray) {
    const delimitedSummary = summary + summaryStringDelimiter;
    const currentSummaryTokens = countTokens(summary);

    if (currentSummaryTokens > maxChunkLength) {
      throw new Error('Single summary is too big');
    }

    const currentChunkTokens = countTokens(currentChunk);
    if (currentChunkTokens + currentSummaryTokens > maxChunkLength) {
      // remove last delimiter summaryStringDelimiter from currentChunk
      currentChunk = currentChunk.slice(0, -summaryStringDelimiter.length);
      summaryChunks.push(currentChunk);
      // new summary chunk
      currentChunk = delimitedSummary;
    } else {
      currentChunk += delimitedSummary;
    }
  }

  currentChunk = currentChunk.slice(0, -summaryStringDelimiter.length);
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
    console.log("No matching files found in the database. Indexing is required.");
    throw new Error("Cannot run without summaries. Indexing is required.");
  }

  let summariesString = "";
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
 * Processes a file by generating a summary
 * and writing the summary to a new file.
 * @param {string} codeBaseDirectory - The directory of the file being processed.
 * @param {string} filePathRelative - The relative path of the file being processed.
 * @param {string} fileContent - The content of the file being processed.
 */
async function generateAndWriteFileSummary(codeBaseDirectory, filePathRelative, fileContent) {
  const maxTokenSingleFile = getMaxTokenSingleFile();
  const { fileSummary } = require('../agents/indexer');
  

  const filePathFull = path.join(codeBaseDirectory, filePathRelative);
  const parsedFile = parseFileContent(codeBaseDirectory, filePathFull, fileContent);
  const fileTokensCount = parsedFile.fileTokensCount;

  console.log(`Processing file: ${chalk.yellow(filePathRelative)}`);
  if (fileTokensCount > maxTokenSingleFile) {
    console.log(chalk.red('File too BIG'));
    return;
  }
  if (fileTokensCount == 0) {
    console.log(chalk.yellow('File Empty'));
    return;
  }

  try {
    const output = await fileSummary(filePathRelative, fileContent);

    if (output) {
      // Keywords
      let keywordsString = "";
      keywords = output.keywords;
      for (const keyword of keywords){
        keywordsString += `${keyword.term} - ${keyword.definition}\n`;
      }
      // functions
      let functionsString = `functions: ${output.functions}`;
      const summary = output.summary + "\n" + functionsString + "\n" + keywordsString;
      // dependenciesLibs
      let dependenciesLibsString = "";
      for (const dependenciesLib of output.dependenciesLibs){
        dependenciesLibsString += `${dependenciesLib}, `;
      }
      // Save to DB
      insertOrUpdateFile(codeBaseDirectory, parsedFile, summary, dependenciesLibsString);
    
      console.log(`${chalk.green(`Updated summary for `)}${chalk.yellow(filePathRelative)}`);
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
    getMaxSummaryTokenCount,
    generateAndWriteFileSummary
}
