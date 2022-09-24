const http = require('http')
require('./src/app')

let server = http.createServer(_app)
if (process.env.NODE_ENV === 'dev') {
    server.listen(80, () => { // http server
        console.log('Listening on port 80')
    })
} else {
    server.listen()
    // note: on a cpanel nodejs host, process actually starts only when the process is contacted; e.g. a page is loaded
}
// default timeout is 0; there is no timeout event. timeout is in ms
// note: this has nothing to do with requests started from this app and only applies to received requests to this server
server.timeout = 10000