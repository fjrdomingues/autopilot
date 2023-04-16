const simpleGit = require('simple-git');

/**
 * Prints the output of git diff to the console.
 */
async function printGitDiff(dir) {
  try {
    const git = simpleGit(dir);
    const diff = await git.diff();
    // console.log(`Git diff output:\n${diff}`);
  } catch (error) {
    console.error(`Error executing git diff: ${error}`);
  }
}

module.exports = {
    printGitDiff
}
