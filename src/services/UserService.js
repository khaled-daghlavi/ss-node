const crypto = require('crypto')
const bcrypt = require('bcrypt')
const x = {}

x.forgotPassword = async function (username) {
    let user = await _Models.User.findOne({username})
    if (!_funcs.errorIfNull(user, false)) {
        return
    }
    if (user.status === _RefVals.User.status.DEACTIVE) {
        throw new _Errors.AppError(_Errors.USER_DEACTIVATED)
    }

    let newPassword = '' + crypto.randomInt(100_000, 999_999)
    // this is where the temp password should be emailed or messaged to user, but we'll only log it
    _log(`forgot password activated for username(${username}), temp password: ${newPassword}`)
    let salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    user.status = _RefVals.User.status.FORGOT_PASSWORD
    //TODO: add history for forgot password + timeout period to block abuse + expire period for temp new password
    await user.save()
}

module.exports = x