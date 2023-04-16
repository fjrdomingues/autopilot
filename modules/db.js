const sqlite3 = require('sqlite3').verbose();
DB_FILE_NAME = 'autopilot.db'

/**
 * @description Creates the files table
 * @param {sqlite3.Database} db - The database to create the table in
 */
function createFilesTable(db){
    const sql =```
CREATE TABLE IF NOT EXISTS files (
    filePath TEXT PRIMARY KEY,
    fileSummary TEXT,
    fileTokensCount INTEGER,
    fileHash TEXT,
    fileTimestamp INTEGER
);
```
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
    dbFilePath = path.posix.join(codeBaseAutopilotDirectory, DB_FILE_NAME)
    const db = new sqlite3.Database(dbFilePath);
    return db;
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
    const sql = ```
INSERT OR REPLACE INTO files (
    filePath, 
    fileSummary, 
    fileTokensCount, 
    fileHash,
    fileTimestamp)
VALUES (?, ?, ?, ?, ?)
```
    db.run(sql, [
        file.filePath, 
        summary, 
        file.fileTokensCount, 
        file.fileHash,
        file.fileTimestamp]);
}



module.exports = { createDB, createFilesTable, insertOrUpdateFile, getDB }