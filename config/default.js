const defer = require('config/defer').deferConfig

module.exports = {
    rtl_languages: ['fa'],
    main_log_path_relative_to_root: 'logs',
    upload_parent_path: 'uploads',
    log: {
        logEntryLimit: 1500, // limit each log file by this number of lines
    },
    mongodb: {
        URL: defer(function () {
            let url = 'mongodb://'
            if (this.mongodb.user && this.mongodb.pass) {
                url += this.mongodb.user + ':' + this.mongodb.pass + '@'
            }
            url += this.mongodb.host + ':' + this.mongodb.port
            if (this.mongodb.db) {
                url += '/' + this.mongodb.db
            }
            return url
        }),
        backupCRON: '5 23 * * *', // every day at 23:05
    },
}