const x = {}

const testUserInfo = {
    other: {
        username: 'jestUser',
        password: 'cJs&52LWy@',
        firstname: 'fake',
        surname: 'faker',
    },
    [_Roles.CUSTOMER.name]: {
        username: 'jestCustomer',
        password: 'a8ksSS4$tO',
        firstname: 'jest',
        surname: 'jester',
        role: _Roles.CUSTOMER.name,
        sid: 1954825664,
        address: 'No.5 washington St.',
    },
}

adminCredentials = {
    username: 'admin',
    password: '12345678',
    plainPassword: '12345678'
}

x.getValidUserInfo = function () {
    return {
        username: 'user_test',
        password: '12345678',
        firstname: 'test',
        surname: 'user',
    }
}

let userCounter = 0

x.addUser = async function (role) {
    let userInfo = testUserInfo[role === _Roles.CUSTOMER.name ? role : 'other']
    let adminUser = await _Models.User.findOne({username: 'admin'})
    let user = await _Models.User.newUser(
        userInfo.username + ('' + userCounter),
        userInfo.password,
        userInfo.firstname,
        userInfo.surname,
        role,
        userInfo.sid,
        userInfo.address,
        adminUser._id,
    )
    user.plainPassword = userInfo.password
    userCounter++

    return user
}

x.userLogin = async function (agent, {username, password} = adminCredentials) {
    return agent.post('/users/login').send({username, password})
}

x.userChangePassword = async function (agent, userInfo = adminCredentials) {
    userInfo.plainPassword += '1'
    await agent.post('/users/change-pass').send({pass: userInfo.plainPassword})
}

module.exports = x