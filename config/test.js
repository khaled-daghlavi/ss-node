const defer = require('config/defer').deferConfig

module.exports = {
    upload_parent_path: "uploads_test",
    mongodb: {
        db: 'sstone_test',
        host: 'localhost',
        port: '27017',
    },
    testResource: {
        JPGFile: 'tests/resource/pic1.jpg',
    },
}