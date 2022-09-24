const mongoose = require('mongoose')

const IdentityCounter = mongoose.model('IdentityCounter')

IdentityCounter.getNextCount = async (model) => {
    let counterObj = await IdentityCounter.findOne({model})

    return counterObj.count + 1
}

IdentityCounter.setNextCounter = async (model, nextCount) => {
    if (!_.isNumber(nextCount)) throw new Error()
    let counterObj = await IdentityCounter.findOne({model})
    _funcs.errorIfNull(counterObj)

    if (counterObj.count === nextCount - 1) return
    if (counterObj.count > nextCount - 1) throw new _Errors.AppError(_Errors.IDENTITY_COUNTER_SETTING_INVALID_COUNT)
    counterObj.count = nextCount - 1

    return counterObj.save()
}

module.exports = IdentityCounter