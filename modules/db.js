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
    fileContent TEXT,
    fileTokensCount INTEGER,
    fileHash TEXT
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
 */
function insertOrUpdateFile(codeBaseDirectory, file){
    db = getDB(codeBaseDirectory);
    const sql = ```
INSERT OR REPLACE INTO files (filePath, fileContent, fileTokensCount, fileHash)
VALUES (?, ?, ?, ?)
```
    db.run(sql, [file.filePath, file.fileContent, file.fileTokensCount, file.fileHash]);
}



module.exports = { createDB, createFilesTable, insertOrUpdateFile, getDB }