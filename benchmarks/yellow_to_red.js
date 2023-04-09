const { main: doTask } = require('../ui')
const agents = require('../agents');
const fs = require('fs');
const path = require('path');

let score = 0
const loops = 1
const task = "In the messages displayed to the user in the ui, change the ones colored yellow to red"

async function main(){
    for (let i = 0; i < loops; i++) {
        try {
            console.log(`Loop ${i + 1}`);
            const result = await doTask(task, test = true)
            const context = fs.readFileSync(path.posix.join(__dirname, 'files', 'ui.js'), 'utf-8')
            const review = await agents.reviewer(task, context, result)
            console.dir(review, { depth: null })
            score += Number(review.output.evaluation.rating)
        } catch {
            score += 0
        }
    }
    console.log('Final Score:', score/loops)
}

main()