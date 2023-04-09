const prompts = require('prompts');

// Asks user for a task
async function getTaskInput() {
    const response = await prompts({
       type: 'text',
       name: 'task',
       message: 'Please enter your TASK (multiline supported):',
       multiline: true,
     });

    return response.task;
}

module.exports= {
    getTaskInput
}