const chalk = require('chalk');

/**
 * 
 * @param {string} task - The task to be completed.
 * @param {object} options - An optional object containing the following properties:
 * @param {string} options.task - The task to be completed (if not provided as the first argument).
 * @param {boolean} options.interactive - A flag indicating whether to prompt the user for input if no task is provided.
 * @returns {Promise<string>} - A promise that resolves with the task to be completed.
 * @description Returns the task to be completed. If the task is not provided as a command line argument or in the options object, the user is prompted to enter a task. If no task is provided or the provided task is an empty string, an error message is printed to the console and the process exits with a status code of 1.
*/
async function getTask(task, options){
  if (!task) task = options.task
  if (!task && options.interactive) task = await getTaskInput()
  if (!task || task =='') {
    console.log(chalk.red("No task provided"));
    process.exit(1);
  }
  console.log(`Task: ${task}`)
  return task
}

/**
 * 
 * @returns @returns {Promise<string>} - A promise that resolves with the user's entered task.
 * @description Asks the user to enter a task using the prompts library. The user's entered task is returned as a string. The function validates that the user entered a non-empty string; if not, the user is prompted to enter a task again.
 */
async function getTaskInput() {
  const prompts = require('prompts');

  const response = await prompts({
    type: 'text',
    name: 'task',
    message: 'Please enter your TASK (multiline supported):',
    multiline: true,
    validate: value => value.length > 0 ? true : 'Please enter a task'
  });

  return response.task;
}

module.exports = { getTask }