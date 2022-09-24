const KiloByteSize = 1024
const MegaByteSize = 1024 * 1024

const singleFileUploadSchema = {
    objectType: 'object',
    doNotReturn: true,
    name: [_.isString, _funcs.maxLen(100)],
    size: [_.isNumber, _funcs.max(10 * MegaByteSize)],
}

const historyComment = ['optional', _.isString, _funcs.maxLen(500)]

function multipleFilesUploadSchema(optional) {
    return {
        objectType: 'array',
        doNotReturn: true,
        ...(optional && {optionalRule: true}),
        rules: [singleFileUploadSchema],
    }
}

global._Validation = {
    historyComment,
    singleFileUploadSchema,
    multipleFilesUploadSchema,
}

_.merge(_Validation, {
    User: require('./UserValidation'),
})