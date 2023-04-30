
/**
 * Asynchronously reindexes the codebase located at the specified directory, using the specified model for indexing.
 * @param {string} codeBaseDirectory - The path to the codebase directory.
 * @param {Object} model - The model used for indexing the codebase.
 * @param {boolean} interactive - A flag indicating whether to use interactive indexing or not.
 * @returns {Promise} A promise that resolves when the indexing process is complete.
 */
async function reindexCodeBase(codeBaseDirectory, model, interactive) {
  if (interactive) {
    const { codeBaseFullIndexInteractive } = require('./codeBase');
    await codeBaseFullIndexInteractive(codeBaseDirectory, model);
  } else {
    const { codeBaseFullIndex } = require('./codeBase');
    await codeBaseFullIndex(codeBaseDirectory, model);
  }
}

module.exports = { reindexCodeBase }