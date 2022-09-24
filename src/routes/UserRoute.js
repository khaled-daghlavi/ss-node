const router = require('express').Router()

router.get('/login', (req, res, next) => {
    if (req.isAuthenticated()) {
        res.redirect(_Routes.USERS_MAIN.path)
    } else {
        res.render('user/login')
    }
})

router.post('/login', (req, res, next) => {
    // username and password default to "username" and "password" in post body
    _app.passport.authenticate('local', {}, function (err, user, info) {
        if (!user) {
            _log(`user login failed, username: ${info.username}`, {cat: 'users'})
            return res.error(_Errors.USER_LOGIN_FAILED)
        }
        if (user.status === _RefVals.User.status.DEACTIVE) {
            return res.error(_Errors.USER_DEACTIVATED)
        }
        _log(`user login: ${user.username}`, {cat: 'users'})
        req.logIn(user, function (err) {
            return res.success()
        })
    })(req, res, next)
})

router.get('/logout', (req, res, next) => {
    if (req.isAuthenticated()) {
        _log(`user logout: ${req.user.username}`, {cat: 'users'})
        req.logout()

        res.success()
    } else {
        res.fail()
    }
})

router.post('/register', async (req, res, next) => {
    let data = await _funcs.validate(req.body, _Validation.User.userRegistration)
    await _Models.User.newUser(
        data.username,
        data.password,
        data.firstname,
        data.surname,
        _Roles.CUSTOMER.name,
        data.sid,
        data.address,
        undefined,
        _RefVals.User.status.USER_ASSIGNED_PASS
    )

    res.success()
})

router.get('/main', _ensureAuthenticated, async (req, res, next) => {
    let userStatus = {}
    if (_RefVals.User.EnforcePasswordChangeOnStatuses.includes(req.user.status)) {
        userStatus = {tempPass: true}
    }

    res.render('user/main', {userStatus})
})

router.get('/manage', _ensureAuthenticated, async (req, res, next) => {
    res.render('user/manage-users', {})
})

router.get('/list', _ensureAuthenticated, async (req, res, next) => {
    let users = await _Models.User.getAll()

    res.success({data: users})
})

router.get('/q', _ensureAuthenticated, async (req, res, next) => {
    let data = await _funcs.validate(req.query, _Validation.User.usersQuery),
        users = await _Models.User.getAll([_Roles.CUSTOMER.name], data.q, data.c)

    res.success({data: users})
})

router.post('/new-user', _ensureAuthenticated, async (req, res, next) => {
    let data = await _funcs.validate(req.body, _Validation.User.newUser)
    await _Models.User.newUser(
        data.username,
        data.password,
        data.firstname,
        data.surname,
        data.role,
        data.sid,
        data.address,
        req.user._id,
    )

    res.success()
})

router.post('/edit-user', _ensureAuthenticated, async (req, res, next) => {
    let data = await _funcs.validate(req.body, _Validation.User.editUser)
    await _Models.User.editUser(data.id, data)

    res.success()
})

router.post('/change-pass', _ensureAuthenticated, async (req, res, next) => {
    if (!_.isString(req.body.pass) || req.body.pass.length < 8 || req.body.pass.length > 35) {
        throw new _Errors.AppError(_Errors.REQUEST_VALIDATION_FAIL)
    }
    await _Models.User.changePassword(req.user._id, req.body.pass)

    res.success()
})

router.post('/deactivate', _ensureAuthenticated, async (req, res, next) => {
    await _Models.User.deactivate(req.body.userId, req.body.deactivate)

    res.success()
})

router.post('/reset-password', _ensureAuthenticated, async (req, res, next) => {
    await _Models.User.resetPassword(req.body.userId)

    res.success()
})

router.post('/forgot-password', async (req, res, next) => {
    let {username} = await _funcs.validate(req.body, _Validation.User.userForgotPassword)
    await _Services.User.forgotPassword(username)

    res.success()
})

module.exports = router