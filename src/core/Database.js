const router = require('express').Router()
const mongoose = require('mongoose')

/**------------------Mongoose Config------------------------*/
// be very careful if you need to change order of calls
// trace _MongoosePromise to fully understand how everything rolls out
_Utils.MongooseAutoIncrement.initialize(mongoose)
global._MongoosePromise = mongoose
    .connect(_Envs.mongodb.URL,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        })
    .then(async () => {
        if (process.env.NODE_ENV === 'test') {
            await mongoose.connection.dropDatabase()
            await mongoose.connection.syncIndexes()
        }
    })

require('../models/Models')

_MongoosePromise = _MongoosePromise.then(async () => {
    /**----------System Initial Values-----------------------------*/
    /**----------Admin User-----------------------------*/
    if (process.env.NODE_ENV !== 'test' || _Test?.createAdmin) {
        let adminUser = await _Models.User.getUser('admin', true)
        if (!adminUser) {
            await _Models.User.newUser('admin', '12345678', 'Khaled', 'Daghlavi', _Roles.ADMIN.name)
            _log(`pre-defined admin user created successfully`)
        }
    }
}).catch(err => _log(`Error System Initial Values: ${err}`))

module.exports = router