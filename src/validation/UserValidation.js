const userUsername = [_.isString, _funcs.minLen(4), _funcs.maxLen(30)],
    userPassword = [_.isString, _funcs.minLen(4), _funcs.maxLen(30)],
    userFirstname = [_.isString, _funcs.minLen(3), _funcs.maxLen(30)],
    userSurname = [_.isString, _funcs.minLen(3), _funcs.maxLen(30)]

function getUserRelatedSchema(type) {
    return {
        objectType: 'object',
        ...(type === 'edit' && {id: [_.isString]}),
        username: userUsername,
        role: [_.isString, _funcs.isIn(_Roles)],
        ...(type === 'new' && {password: userPassword}),
        firstname: userFirstname,
        surname: userSurname,
        sid: ['optional', _.isString, _funcs.regMatch(/^\d+$/)],
        address: ['optional', _.isString, _funcs.minLen(5), _funcs.maxLen(120)],
    }
}

const newUserSchema = getUserRelatedSchema('new')
const editUser = getUserRelatedSchema('edit')

const userRegistrationSchema = {
    objectType: 'object',
    username: userUsername,
    password: userPassword,
    firstname: userFirstname,
    surname: userSurname,
}

const userForgotPasswordSchema = {
    objectType: 'object',
    username: userUsername,
}

const usersQuerySchema = {
    objectType: 'object',
    q: [_.isString, _funcs.minLen(3), _funcs.maxLen(30)],
    c: [_.isString, _funcs.minLen(3), _funcs.maxLen(30)],
}

module.exports = {
    newUser: newUserSchema,
    userRegistration: userRegistrationSchema,
    userForgotPassword: userForgotPasswordSchema,
    editUser: editUser,
    usersQuery: usersQuerySchema,
}