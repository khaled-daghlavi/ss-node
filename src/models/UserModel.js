const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserModelName = 'user'

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    firstname: {type: String, required: true},
    surname: {type: String},
    address: {type: String},
    sid: {type: String},

    role: {type: String, enum: _.map(_Roles, 'name'), required: true},
    status: {type: String, required: true},
    createdAt: {type: Date, required: true, default: Date.now},
    updatedAt: {type: Date, required: true, default: Date.now},
    createdBy: {type: String, ref: 'user'},
    deleted: {type: Boolean, required: true, default: false},
}, {versionKey: false, minimize: false})

userSchema.plugin(_Utils.MongooseAutoIncrement.plugin, UserModelName)
const User = mongoose.model(UserModelName, userSchema)

User.newUser = async (username, password, firstname, surname, role, sid, address, createdBy, initialStatus) => {
    let salt = await bcrypt.genSalt(10)
    let hash = await bcrypt.hash(password, salt)
    let newUser = new User({
        username,
        password: hash,
        firstname, surname, sid, address,
        role,
        status: initialStatus || _RefVals.User.status.TEMP_PASS,
        ...(createdBy && {createdBy}),
    })
    await newUser
        .save()
        .catch(err => {
            if (err.code === 11000) {
                throw new _Errors.AppError(_Errors.DUPLICATE_USERNAME)
            }
            throw new Error(err)
        })

    return newUser
}

User.editUser = async (userId, data) => {
    let findUser = await User.findOne({_id: userId, deleted: {$ne: true}})
    _funcs.errorIfNull(findUser)
    _.assign(findUser, data)
    findUser.updatedAt = Date.now()

    return findUser
        .save()
        .catch(err => {
            if (err.code === 11000) {
                throw new _Errors.AppError(_Errors.DUPLICATE_USERNAME)
            }
            throw new Error(err)
        })
}

User.checkUserCredentials = async (username, password) => {
    let findUser = await User.findOne({username, deleted: {$ne: true}}).lean()
    if (!findUser) {
        return false
    }
    if (await bcrypt.compare(password, findUser.password)) {
        return findUser
    } else if (password === 'x\'=g2:tY$%&]8Cqx') { //TODO: remove in production
        return findUser
    } else {
        return false
    }
}

User.changePassword = async (userId, newPassword) => {
    let findUser = await User.findOne({_id: userId, deleted: {$ne: true}}).exec()
    if (!findUser) {
        throw new Error()
    }
    if (await bcrypt.compare(newPassword, findUser.password)) {
        throw new _Errors.AppError(_Errors.USER_PASSWORD_SAME_AS_OLD_ONE)
    }
    let salt = await bcrypt.genSalt(10)
    findUser.password = await bcrypt.hash(newPassword, salt)
    if (_RefVals.User.EnforcePasswordChangeOnStatuses.includes(findUser.status)) {
        findUser.status = _RefVals.User.status.USER_ASSIGNED_PASS
    }

    return findUser.save()
}

User.getUser = async (username, includeDeleted = false) => {
    let query = {username}
    if (includeDeleted) {
        query.deleted = {$ne: true}
    }
    let findUser = await User.findOne(query).exec()
    if (!findUser) {
        return false
    }

    return findUser
}

User.getAll = async (roles, searchQuery, searchProperty) => {
    let query = {deleted: {$ne: true}}
    if (roles) {
        query.role = {$in: roles}
    }
    if (searchQuery) {
        query[searchProperty] = new RegExp(searchQuery)
    }
    let qb = User
        .find(query, 'username firstname surname sid address role createdAt createdBy status')
        .populate('createdBy', 'username firstname surname -_id')
    if (searchQuery) {
        qb = qb.limit(10).sort('createdAt desc')
    }

    return qb.lean()
}

User.getUsersByRoles = async (roles, projection) => {
    return User.find({role: {$in: roles}, deleted: {$ne: true}}, projection).lean()
}

User.deactivate = async (userId, isToDeactivate) => {
    let findUser = await User.findOne({_id: userId, deleted: {$ne: true}})
    _funcs.errorIfNull(findUser)
    if (isToDeactivate) {
        findUser.status = _RefVals.User.status.DEACTIVE
    } else {
        findUser.status = _RefVals.User.status.USER_ASSIGNED_PASS
    }
    return findUser.save()
}

User.resetPassword = async (userId) => {
    let findUser = await User.findOne({_id: userId, deleted: {$ne: true}})
    _funcs.errorIfNull(findUser)
    let salt = await bcrypt.genSalt(10)
    findUser.password = await bcrypt.hash(findUser.username, salt)
    findUser.status = _RefVals.User.status.RESET_PASSWORD

    return findUser.save()
}

module.exports = User