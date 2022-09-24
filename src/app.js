const express = require('express')
const fs = require('fs')
global._app = express()
global._path = require('path')
global._Envs = require('config')
const errors = require('./core/Errors')
require('./utils/Utils')
require('./services/Services')
require('./configs/Configs')
const db = require('./core/Database')
const auth = require('./core/Authentication')
require("./validation/Validation")

/**-----------------Internationalization----------------------------- */
const i18next = require('i18next')
const i18nextBackend = require('i18next-fs-backend')
const i18nextMiddleware = require('i18next-http-middleware')
i18next.use(i18nextBackend).use(i18nextMiddleware.LanguageDetector).init({
    fallbackLng: 'en',
    lng: 'en',
    ns: ['trans'],
    defaultNS: 'trans',
    backend: {
        loadPath: './locales/{{lng}}-{{ns}}.json',
    },
    detection: {
        order: ['cookie', 'header'],
        ignoreCase: true,
        lookupHeader: 'accept-language',
        lookupCookie: 'i18next',
    },

})
_app.use(i18nextMiddleware.handle(i18next))
/**-----------------File Upload----------------------------- */
    //https://www.npmjs.com/package/express-fileupload
const fileUpload = require('express-fileupload')
_app.use(fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: 'uploads/tmp',
    safeFileNames: true,
    preserveExtension: 4,
    // ...(process.env.NODE_ENV === 'dev' && {debug: true}),
}))
_app.use(function (req, res, next) {
    for (let filesKey in req.files) {
        if (/^\..+$/.test(req.files[filesKey].name)) {
            req.files[filesKey].name = req.files[filesKey].name.replace(/^(\..+$)/, 'attach$1')
        }
    }
    next()
})
global._convertFormData = function (...keysToFormatAsArray) {
    return (req, res, next) => {
        if (keysToFormatAsArray.length !== 0 && req.files) {
            for (let key of keysToFormatAsArray) {
                if (req.files[key] && !_.isArray(req.files[key])) {
                    req.files[key] = [req.files[key]]
                }
            }
        }
        req.body = {
            ...JSON.parse(req.body.body),
            ...req.files,
        }
        next()
    }
}
/**-----------------MongoDB--------------------------------- */
_app.mongoClient = require('mongodb').MongoClient
/**----------------Logger/Morgan Config------------------------ */
if (process.env.NODE_ENV === 'dev') {
    const logger = require('morgan')
    let date = new Date()
    logger.token('remote', (req, res) => {
        return `${['::1', '::ffff:127.0.0.1'].includes(req._remoteAddress) ? '' : req._remoteAddress + ' '}${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    })
    _app.use(logger(':remote :method :url :status'))

    const cors = require('cors')
    _app.use(cors())
}
/**------------------------------------------------------------ */
_app.set('views', `${__dirname}/views`)
_app.set('view engine', 'ejs')
_app.use(express.json({limit: '55mb', extended: true}))
_app.use(express.urlencoded({limit: '55mb', extended: true}))
_app.use(express.static(_path.relative(process.cwd(), 'public')))
// if (process.env.NODE_ENV !== 'dev') { // no need; redirect handled through cpanel
//     _app.use(function (req, res, next) { // re-route http to https
//         if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
//             res.redirect('https://' + req.headers.host + req.url)
//         } else {
//             next()
//         }
//     })
// }
/**--------------Overriding Express API---------------------*/
let originalRenderFunction = _app.response.render
_app.response.render = function (view, data = {}) {
    let defaultData = {
        req: this.req,
        isRTL: _Envs.rtl_languages.includes(this.req.lng),
        ...global,
        devMode: (process.env.NODE_ENV === 'dev'),
    }
    originalRenderFunction.call(this, view, Object.assign(defaultData, data))
}
_app.response.success = function (data = {}, statusCode = 200) {
    this.status(statusCode).send(data)
}
_app.response.fail = function (data = {}, statusCode = _Errors.DEFAULT_FAIL_STATUS_CODE) {
    this.status(statusCode).send(data)
}
_app.response.error = function (err) {
    _Errors.errorResponse(this.req, this, new _Errors.AppError(err))
}
_app.response.pageNotFound = function () {
    this.status(404)
    this.render('misc/page-block', {status: 404})
}
_app.response.pageAccessDenied = function () {
    this.status(403)
    this.render('misc/page-block', {status: 403})
}
_app.response.downloadFile = function (filename, subDir) {
    let resourcePath = _Envs.get('upload_parent_path') + '/' + subDir + '/' + filename
    fs.access(resourcePath, fs.constants.F_OK, (err) => {
        if (err) {
            this.pageNotFound()
        } else {
            this.download(resourcePath)
        }
    })
}
/**---------------------------------------------------------*/
_log(`Node started. version: ${process.env.npm_package_version}`)
/**-----------------Routes--------------------------------- */
_app.get('/', (req, res, next) => {
    res.redirect('/users/login')
})
require('./routes/Routes')
/**----------------Error Handling-------------------------- */
_app.use(_Errors.errorHandling)
_app.use((req, res, next) => {
    // keep this as the very end middleware to be applied to requests which none of routes apply to (404)
    res.pageNotFound()
})

module.exports = _app