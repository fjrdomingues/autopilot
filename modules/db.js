const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { countTokens } = require('./tokenHelper');

const { getCodeBaseAutopilotDirectory } = require('./autopilotConfig');

DB_FILE_NAME = 'autopilot.db'

/**
 * @description Creates the files table
 * @param {sqlite3.Database} db - The database to create the table in
 */
function createFilesTable(db){
    const sql =`
CREATE TABLE IF NOT EXISTS files (
    path TEXT PRIMARY KEY,
    tokensCount INTEGER,
    summary TEXT,
    summaryTokensCount INTEGER,
    hash TEXT,
    timestamp INTEGER
);
`
    db.run(sql);
}

/**
 * @description Creates the files table
 * @param {string} codeBaseAutopilotDirectory - The path to the .autopilot directory of the codebase
*/
function createDB(codeBaseDirectory){
    const db = getDB(codeBaseDirectory)
    createFilesTable(db);
}

/**
 * @description Creates the files table
 * @param {string} codeBaseAutopilotDirectory
 * @returns {sqlite3.Database} db
 */
function getDB(codeBaseDirectory){
    codeBaseAutopilotDirectory = getCodeBaseAutopilotDirectory(codeBaseDirectory);
    dbFilePath = path.posix.join(codeBaseAutopilotDirectory, DB_FILE_NAME);
    const db = new sqlite3.Database(dbFilePath);
    return db;
}

/**
 * Deletes the file at the specified file path from the "files" table in the SQLite database
 * located in the code base directory specified by the codeBaseDirectory parameter.
 * @param {string} codeBaseDirectory - The absolute path to the code base directory containing the SQLite database.
 * @param {string} filePath - The absolute path to the file to be deleted.
 */
function deleteFile(codeBaseDirectory, filePath){
    db = getDB(codeBaseDirectory);
    const sql = `
delete from files 
where path = ?`
    db.run(sql, [filePath]);
}


/**
 * @description Inserts or updates a file in the files table
 * @param {sqlite3.Database} db - The database to insert the file into
 * @param {object} file - The file to insert or update
 * @param {string} file.filePath - The relative path of the file
 * @param {string} file.fileContent - The content of the file
 * @param {number} file.fileTokensCount - The count of tokens in the file
 * @param {string} file.fileHash - The hash of the file content
 * @param {number} file.fileTimestamp - The timestamp when the file was last modified
 */
function insertOrUpdateFile(codeBaseDirectory, file, summary){
    db = getDB(codeBaseDirectory);
    const summaryTokensCount = countTokens(summary);
    const sql = `
INSERT OR REPLACE INTO files (
    path, 
    tokensCount,
    summary, 
    summaryTokensCount, 
    hash,
    timestamp)
VALUES (?, ?, ?, ?, ?, ?)
`
    db.run(sql, [
        file.filePath, 
        file.fileTokensCount, 
        summary,
        summaryTokensCount,
        file.fileHash,
        file.fileTimestamp]);
}

/**
 * @description Gets all files from the files table
 * @param {string} codeBaseDirectory - The path to the codebase
 * @returns {Array<{
    * path: string, // The relative path of the file.
    * hash: string, // The hash of the file content.
    * timestamp: string // The timestamp when the file was last modified.
 * }>} - An array of objects containing file details retrieved from the directory.
 * @throws {Error} If an error occurs during the database query.
*/
async function getDBFiles(codeBaseDirectory){
    db = getDB(codeBaseDirectory);
    const sql = `
SELECT path, hash, timestamp 
FROM files
`
    files = await new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {
            if (err) {
            reject(err);
            } else {
            resolve(rows);
            }
        });
    });
    return files;
}
    


module.exports = { createDB, createFilesTable, insertOrUpdateFile, getDB, getDBFiles, deleteFile }