const prompts = require('prompts');

/**
 * @description Asynchronous function that runs an agent function with given variables.
 * @param {function} agentFunction - The agent function to be executed asynchronously.
 * @param {any} var1 - The first variable to be passed as an argument to the agent function.
 * @param {any} var2 - The second variable to be passed as an argument to the agent function.
 * @param {boolean} interactive=false - A boolean indicating whether or not to prompt the user for approval after running the agent function.
 * @returns {Promise<any>} A Promise that resolves with the return value of the agent function if not in interactive mode, otherwise resolves or rejects based on user input.
*/
async function runAgent(agentFunction, var1, var2, interactive=false){
  console.log("(agent)", agentFunction.name);
  if (!interactive){
    return await agentFunction(var1, var2);
  }

  // interactive
  res = await agentFunction(var1, var2);
  console.dir(res, { depth: null })
  const proceed = await prompts({
    type: 'select',
    name: 'value',
    message: 'Approve agent\'s reply ?',
    choices: [
      { title: 'Approve - continue', value: 'continue' },
      { title: 'Retry - Rerun agent', value: 'retry'},
      { title: 'Abort', value: 'abort'}
    ]
  });
  if (proceed.value === 'continue') return res
  if (proceed.value === 'retry') await runAgent(agentFunction, var1, var2, interactive)
  if (proceed.value === 'abort') process.exit(1)
}

module.exports = { runAgent }