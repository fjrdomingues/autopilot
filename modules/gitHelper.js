const simpleGit = require('simple-git');

/**
 * Returns the output of git diff as a string.
 */
async function getGitDiff(dir) {
  try {
    const git = simpleGit(dir);
    const diff = await git.diff();
    return diff;
  } catch (error) {
    console.error(`Error executing git diff: ${error}`);
    return '';
  }
}

/**
 * Prints the output of git diff to the console.
 */
async function printGitDiff(dir) {
  const diff = await getGitDiff(dir);
  console.log(`Git diff output:\n${diff}`);
}

module.exports = {
    getGitDiff,
    printGitDiff
}