const router = require('express').Router()
const session = require('express-session') // Express Session Middleware for building a user session
const MongoStore = require('connect-mongo')
const passport = require('passport')// to handle user authentication
const LocalStrategy = require('passport-local').Strategy // the user authentication strategy
/**---------------------Session Config--------------------------**/
let sessionCreatedPromiseResolve,
    sessionCreatedPromise = new Promise(resolve => {
        sessionCreatedPromiseResolve = resolve
    })
_MongoosePromise = _MongoosePromise.then(() => {
    return sessionCreatedPromise
})
//_app.set('trust proxy', 1) // if cookie.secure is set, this might be required
_app.use(session({
    secret: '65googy player53',
    resave: false,
    saveUninitialized: false,
    // name: 'filterC.sid', // default 'connect.sid'
    cookie: {
        // if maxAge or expires (only one should be set) is not set it would be a Session cookie; Session cookies are removed when the client shuts down
        // maxAge is set in milliseconds but expires is set in exact date which the cookie should be expired
        path: '/',
        secure: false, // cookie only sent on https or localhost //TODO: change to true in production
        httpOnly: true,
        // rolling: true, // basically resetting the expiration countdown (maxAge) on every response. by default, the expiration countdown resets only when the session is modified.
        sameSite: 'strict',
    },
    store: MongoStore.create({
        mongoUrl: _Envs.mongodb.URL,
        collectionName: 'sessions',
        useUnifiedTopology: true,
        // 'ttl' option is expire date for each session, default is 14 days
        // Each time a user interacts with the server, its session expiration date is refreshed
        // touchAfter: 22 * 3600, // (time period in seconds)
        // 'touchAfter' limits applying changes to session to a period of time (changes to session data not included)
        // crypto: { secret: 's3qui2rel'}, // enable to encrypt session data
    }),
}))
/**---------------------Set up Passport--------------------------**/
passport.use('local',
    new LocalStrategy({}, (username, password, done) => {
        _Models.User.checkUserCredentials(username, password)
               .then(requestedUser => {
                   if (requestedUser) {
                       return done(null, requestedUser)
                   } else {
                       return done(null, false, {username})
                   }
               })
               .catch(err => _log(`Error with user authentication: ${err}`))
    }),
)
passport.serializeUser(function (user, done) {
    done(null, user.username)
})

passport.deserializeUser(function (username, done) {
    return _Models.User.getUser(username)
                  .then(requestedUser => done(null, requestedUser))
})
_app.use(passport.initialize())
_app.use(passport.session())

_app.passport = passport
sessionCreatedPromiseResolve()

/**--------------------------------------------------------------**/
function ensureAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        //TODO: need to separate APIs from pages to have semantically better responses
        // e.g. send 403 on unauthenticated requests instead of redirect
        // /api/1.0/login
        res.redirect(_Routes.USERS_LOGIN.path)
        return
    }
    if (req.user.status === _RefVals.User.status.DEACTIVE) {
        req.logout()
        res.redirect(_Routes.USERS_LOGIN.path)
        return
    }

    let reqPath = req.originalUrl.replace(/^([^?]+)\??\S*$/, '$1')
    if (_RefVals.User.EnforcePasswordChangeOnStatuses.includes(req.user.status)
        && !reqPath.match(/^\/users\/(main|change-pass)$/)) {
        // user must assign a new password first
        res.redirect(_Routes.USERS_MAIN.path)
        return
    }
    for (let service of _Roles[req.user.role].services) {
        let pathMatch = checkPath(reqPath, service.pathRegex || service.path)
        if (!pathMatch && _.isArray(service.sidePaths)) {
            for (let path of service.sidePaths) {
                if (checkPath(reqPath, path)) {
                    pathMatch = true
                    break
                }
            }
        }
        if (pathMatch && (!service.methods || service.methods.includes(req.method))) {
            req.service = service
            return next()
        }
    }
    for (let service of _RefVals.Roles.AuthenticatedServices) {
        if (checkPath(reqPath, service.pathRegex || service.path)) {
            return next()
        }
        if (_.isArray(service.sidePaths)) {
            for (let path of service.sidePaths) {
                if (checkPath(reqPath, path)) {
                    return next()
                }
            }
        }
    }
    if (req.user.role !== _Roles.CUSTOMER.name) {
        for (let service of _RefVals.Roles.EveryoneButTheCustomerServices) {
            if (checkPath(reqPath, service.pathRegex || service.path)) {
                return next()
            }
        }
    }
    res.pageAccessDenied()
}

function checkPath(reqPath, matchPath) {
    if (_.isRegExp(matchPath)) {
        if (reqPath.match(matchPath)) {
            return true
        }
    } else {
        if (reqPath.match(new RegExp(`^${matchPath}$`))) {
            return true
        }
    }

    return false
}

global._ensureAuthenticated = ensureAuthenticated

module.exports = router