const errors = {
    REQUEST_VALIDATION_FAIL: 1,
    DEFAULT_FAIL_STATUS_CODE: 400,

    UNAUTHORIZED_ACCESS: 403,
    RESOURCE_NOT_FOUND: 404,

    DUPLICATE_USERNAME: 1000,
    IDENTITY_COUNTER_SETTING_INVALID_COUNT: 1001,

    USER_DEACTIVATED: 1100,
    USER_PASSWORD_SAME_AS_OLD_ONE: 1101,
    USER_LOGIN_FAILED: 1102
}

errors.message = {
    [errors.REQUEST_VALIDATION_FAIL]: 'common.request_body_validation_failed',

    [errors.DUPLICATE_USERNAME]: 'user_login.duplicate_username',
    [errors.IDENTITY_COUNTER_SETTING_INVALID_COUNT]: 'set value for count is lower than current or invalid',

    [errors.USER_DEACTIVATED]: 'user_login.user_deactivated_msg',
    [errors.USER_PASSWORD_SAME_AS_OLD_ONE]: 'user_login.password_same_as_old_one',
    [errors.USER_LOGIN_FAILED]: 'user_login.login_failed',
}

errors.statusCode = {
    [errors.UNAUTHORIZED_ACCESS]: 403,
    [errors.RESOURCE_NOT_FOUND]: 404,

    [errors.USER_DEACTIVATED]: 403,
    [errors.USER_LOGIN_FAILED]: 401,
}

class AppError extends Error {
    constructor(errCode, message, errData) {
        super(message)
        this.type = 'AppError'
        this.errCode = errCode
        this.errMsg = errors.message[errCode]
        this.statusCode = errors.statusCode[errCode]
        this.data = errData
    }
}

errors.AppError = AppError

errors.errorHandling = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }
    if (process.env.NODE_ENV === 'dev') {
        if (err instanceof _Errors.AppError && err.errCode === _Errors.REQUEST_VALIDATION_FAIL) {
            console.log(err.message)
        } else {
            console.log(err.stack)
        }
    } else {
        let errMsg = err.message
        if (err instanceof _Errors.AppError) {
            errMsg = `ErrorCode: ${err.errCode}, ${errMsg}, data: ${JSON.stringify(err.data)}, userId: ${req.user?.username || 'none'}`
        }
        _log(`${errMsg}, stack: ${err.stack}, userId: ${req.user?.username || 'none'}`, {cat: 'errors', logToConsole: false})
    }
    if (err instanceof _Errors.AppError) {
        if (err.errCode === errors.UNAUTHORIZED_ACCESS) {
            res.pageAccessDenied()
            return
        }
        if (err.errCode === errors.RESOURCE_NOT_FOUND) {
            res.pageNotFound()
            return
        }
        //TODO: will need a descriptive error response;
        // nested body for each type of error and a detailed message
        // timestamp and route
        errors.errorResponse(req, res, err)
    } else {
        res.fail()
    }
}

errors.errorResponse = (req, res, err) => {
    res.fail({errMsg: req.t(err.errMsg)}, err.statusCode)
}

global._Errors = errors
module.exports = errors