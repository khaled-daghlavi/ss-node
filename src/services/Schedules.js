const superagent = require('superagent')
const schedule = require('node-schedule')
const x = {}

schedule.scheduleJob(_Envs.mongodb.backupCRON, async (fireDate) => {
    // TODO: write a scheduled task to backup mongodb db
})

module.exports = x