global._ = require('lodash')
global._log = require('./Logger')
global._funcs = require('./Funcs')

global._Utils = {
    MongooseAutoIncrement: require('./MongooseAutoIncrement')
}