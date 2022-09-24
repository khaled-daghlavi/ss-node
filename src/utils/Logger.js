const fs = require('fs')
const Promise = require('promise')
const appendFile = Promise.denodeify(fs.appendFile)

// https://stackoverflow.com/questions/9781218
const Colors = [
    "\x1b[31m", // FgRed
    "\x1b[34m", // FgBlue
    "\x1b[35m", // FgMagenta
    "\x1b[36m", // FgCyan
    "\x1b[32m", // FgGreen
    "\x1b[33m", // FgYellow
    "\x1b[30m", // FgBlack (here white)
    // "\x1b[37m", // FgWhite
]

let logFiles = {},
    logEntryLimit = _Envs.log.logEntryLimit,
    colorAssign = {},
    logPath = process.cwd() + _path.sep + _Envs.get('main_log_path_relative_to_root') + _path.sep

function log(msg, arg = {}) {
    // as long as the path 'logPath' exists, any sub file or folders missing errors, are handled dynamically, e.g. files will be recreated even if files are deleted in runtime
    if (process.env.NODE_ENV === 'test') {
        return
    }
    let filePath, logFile
    if (arg.cat === undefined || arg.cat === 'log') {
        filePath = ''
        arg.cat = 'log' // category(folder) name
    } else {
        filePath = arg.cat + _path.sep
    }
    if (arg.logToConsole !== false) {
        let d = new Date(),
            cat = '',
            colorScheme = '%s'
        if (arg.cat !== 'log') {
            cat = ` (${arg.cat})`
            if (!colorAssign[arg.cat]) {
                if (Colors.length !== 0) {
                    colorAssign[arg.cat] = Colors.pop()
                } else {
                    colorAssign[arg.cat] = '\x1b[0m'
                }
            }
            colorScheme = `${colorAssign[arg.cat]}%s\x1b[0m`
        }
        console.log(colorScheme, `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}${cat}: ${msg}`)
    }
    if (arg.logToFile !== false) {
        let regex = new RegExp('^' + arg.cat + '([0-9]+)\\.txt$'),
            regex1 = new RegExp('.*' + arg.cat + '([0-9]+)\\.txt$')
        if (logFiles.hasOwnProperty(arg.cat)) {
            logFile = logFiles[arg.cat]
            logFile.counter++
        } else {// find the latest log file based on index or create one if there aren't any
            try {
                let files = fs.readdirSync(logPath + filePath)
                if (files.length !== 0) {
                    files.forEach(entry => {
                        if (regex.test(entry)) {
                            let index = Number(entry.replace(regex, '$1'))
                            if (logFile === undefined || (Number(logFile.replace(regex, '$1')) < index)) {
                                logFile = logPath + filePath + arg.cat + `${index}.txt`
                            }
                        }
                    })
                }
                if (logFile === undefined) {
                    logFile = logPath + filePath + arg.cat + `0.txt`
                }
            } catch (e) {
                fs.mkdirSync(logPath + filePath)
                logFile = logPath + filePath + arg.cat + '0.txt'
                log(logPath + filePath + ' created')
            }
            logFiles[arg.cat] = {path: logFile, counter: 0}
            logFile = logFiles[arg.cat]
        }
        if (logFile.counter >= logEntryLimit) {
            let newIndex = Number(logFile.path.replace(regex1, '$1'))
            newIndex++
            logFile.counter = 0
            logFile.path = logPath + filePath + arg.cat + `${newIndex}.txt`
        }
        appendFile(logFile.path, new Date().toLocaleString() + ': ' + msg + '\r\n')
            .catch(err => {
                log(`Error appending to log, category: ${arg.cat}, msg: ${msg}, err: ${JSON.stringify(err)}`)
                fs.access(logPath + filePath, fs.constants.F_OK, (err) => {
                    if (err) {
                        log(`Error accessing the log file, attempting to create file, err: ${JSON.stringify(err)}`)
                        fs.mkdirSync(logPath + filePath)
                        log(logPath + filePath + ' created on runtime')
                    }
                })
            })
    }
}

module.exports = log