const models = {}

global._Models = models

// do not mess with the order unless you absolutely must
models.User = require("../models/UserModel")
models.IdentityCounter = require("../models/IdentityCounterModel")

const mongoose = require("mongoose")
models.withTransaction = async function(fn) {
    let session = await mongoose.startSession()
    await session.withTransaction(fn)
    return session.endSession()
    // MongoDB currently only supports transactions on replica sets, not standalone servers. Make sure your MongoDb meet the requirements
}

module.exports = models