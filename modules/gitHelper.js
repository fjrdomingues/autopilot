const { exec } = require('child_process');

/**
 * Prints the output of git diff to the console.
 */
function printGitDiff(dir){
    exec(`cd ${dir}; git diff`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing git diff: ${error}`);
          return;
        }
        console.log(`Git diff output:\n${stdout}`);
    });    
}

module.exports = {
    printGitDiff
}
