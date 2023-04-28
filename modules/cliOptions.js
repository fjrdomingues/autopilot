/**
* Returns an object containing the command line options parsed using the Yargs library.
* @param {boolean} test - A flag indicating whether or not to run in test mode.
* @param {string} task - The task to be completed, or false if not provided.
* @returns {{
  * task: string | false, // The task to be completed, or false if not provided.
  * interactive: boolean, // A flag indicating whether to run in interactive mode.
  * dir: string, // The path to the directory containing the code files.
  * reindex: boolean, // A flag indicating whether to reindex the entire codebase.
  * autoApply: boolean, // A flag indicating whether to auto apply change suggestions.
  * indexGapFill: boolean // A flag indicating whether to check for gaps between the DB and the codebase and reconcile them.
  * }}
*/
function getOptions(task, test){
  const yargs = require('yargs');

  const options = yargs
  .option('interactive', {
    alias: 'i',
    describe: 'Whether to run in interactive mode',
    default: false,
    type: 'boolean'
  })
  .option('task', {
    alias: 't',
    describe: 'The task to be completed',
    demandOption: false, // set initial value to false
    default: task,
    type: 'string'
  })
  .option('dir', {
    alias: 'd',
    describe: 'The path to the directory containing the code files',
    default: process.env.CODE_DIR,
    type: 'string'
  })
  .option('auto-apply', {
    alias: 'a',
    describe: 'Auto apply change suggestions',
    default: !test,
    type: 'boolean'
  })
  .option('reindex', {
    alias: 'r',
    describe: 'Reindexes the entire codebase',
    default: false,
    type: 'boolean'
  })
  .option('index-gap-fill', {
    alias: 'g',
    describe: 'Checks for gaps between the DB and the codebase and reconciles them',
    default: true,
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .argv;

  if (!options.interactive && !options.task) {
    console.log('Please provide a task using the -t flag.');
    console.log('  node ui -t task1');
    yargs.showHelp();
    process.exit(1);
  }

  return options;
}

module.exports = { getOptions };