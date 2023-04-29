const { main: doTask } = require('../ui')
const fs = require('fs');
const path = require('path');
const LineDiff = require("line-diff")
const { review } = require('../agents/reviewer')

let score = 0
const loops = 1
const task = "In the messages displayed to the user in the ui, change the messages that are colored yellow to the color red"
const criteria = [
    "The chalk.yellow statement must be changed to chalk.red",
    "No other lines can be changed",
    "All other console.logs must remain untouched",
    "Don't change console.log statements if they don't have chalk already"
]

async function main(){
    for (let i = 0; i < loops; i++) {
        try {
            console.log(`Loop ${i + 1}`);
            const oldFile = fs.readFileSync(path.posix.join(__dirname, 'files', 'ui.js'), 'utf-8')
            const solution = await doTask(task, test = true)
            const newFile = solution[0].code
            const diff = new LineDiff(oldFile,newFile).toString()
            console.log(diff)
            const reviewRes = await review(task, diff, criteria)
            console.dir(reviewRes, { depth: null })
            score += Number(reviewRes.output.evaluation.rating)
        } catch (error){
            console.log(error)
            score += 0
        }
    }
    console.log('Final Score:', score/loops)
}

main()