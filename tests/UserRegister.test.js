require('../src/app')
const request = require("supertest")
const testUserService = require('./testUserService')
const testUtils = require("./testUtils")

let Agent

beforeAll(async () => {
    await _MongoosePromise
    Agent = request.agent(_app)
})

beforeEach(async () => {
    await testUtils.clearCollection('User')
})

describe('User Registration', () => {
    it('registers a user successfully', async () => {
        let validUserInfo = testUserService.getValidUserInfo()
        let res = await Agent
            .post(_Routes.USERS_REGISTRATION.path)
            .send(validUserInfo)
        expect(res.status).toBe(200)
        let userList = await _Models.User.find({})
        expect(userList.length).toBe(1)
        let user = await _Models.User.findOne({username: validUserInfo.username})
        for (let attr in validUserInfo) {
            if (attr === 'password') {
                expect(user.password).not.toBe(validUserInfo.password)
            } else {
                expect(user[attr]).toBe(validUserInfo[attr])
            }
        }
        expect(user.status).toBe(_RefVals.User.status.USER_ASSIGNED_PASS)
        expect(user.role).toBe(_Roles.CUSTOMER.name)
        expect(user.deleted).toBe(false)
    })

    it('returns error duplicate username', async () => {
        let validUserInfo = testUserService.getValidUserInfo()
        let res = await Agent
            .post(_Routes.USERS_REGISTRATION.path)
            .send(validUserInfo)
        expect(res.status).toBe(200)
        let userList = await _Models.User.find({})
        expect(userList.length).toBe(1)
        res = await Agent
            .post(_Routes.USERS_REGISTRATION.path)
            .send(validUserInfo)
        expect(res.status).toBe(400)
        expect(res.body.errMsg).toBe(testUtils.t.en['user_login']['duplicate_username'])
        userList = await _Models.User.find({})
        expect(userList.length).toBe(1)
    })

    it('returns error on bad request with missing fields', async () => {
        let validUserInfo = testUserService.getValidUserInfo()
        for (let key in validUserInfo) {
            let incompleteUserInfo = testUserService.getValidUserInfo()
            delete incompleteUserInfo[key]
            let res = await Agent
                .post(_Routes.USERS_REGISTRATION.path)
                .send(incompleteUserInfo)
            expect(res.status).toBe(400)
        }
        let userList = await _Models.User.find({})
        expect(userList.length).toBe(0)
    })

    //TODO: add complex password checking (uppercase, lowercase, special character)
    it.each`
    field         | value
    ${'username'} | ${null}
    ${'username'} | ${'asr'}
    ${'username'} | ${'a'.repeat(31)}
    `('returns error when $field is $value', async ({field, value}) => {
        let invalidUserInfo = testUserService.getValidUserInfo()
        invalidUserInfo[field] = value
        let res = await Agent
            .post(_Routes.USERS_REGISTRATION.path)
            .send(invalidUserInfo)
        expect(res.status).toBe(400)
        let userList = await _Models.User.find({})
        expect(userList.length).toBe(0)
    })
})