const fs = require("fs")
const Promise = require('promise')
const readFile = Promise.denodeify(fs.readFile)
const writeFile = Promise.denodeify(fs.writeFile)
const funcs = require('./Validator')

funcs.readJson = function (relativePath) { // path must be relative to main path e.g., 'private/smth.json'
    return readFile(relativePath).then(readRes => JSON.parse(readRes))
}

funcs.writeJson = function (json, relativePath) { // path must be relative to main path e.g., 'private/smth.json'
    return writeFile(relativePath, JSON.stringify(json, null, 2))
}

funcs.toFaDigit = function (strIn) {
    return ('' + strIn).replace(/\d+/g, function (digit) {
        let ret = ''
        for (let i = 0, len = digit.length; i < len; i++) {
            ret += String.fromCharCode(digit.charCodeAt(i) + 1728)
        }
        return ret
    })
}

funcs.errorIfNull = function (data, throwError = true) {
    if (_.isNull(data)) {
        if (!throwError) {
            return false
        }
        throw new _Errors.AppError(_Errors.RESOURCE_NOT_FOUND)
    }
    return data
}

funcs.saveUpload = function (file, subPath, filename) {
    function loopOverFiles(suffixCounter, checkName) {
        suffixCounter++
        for (let entry of files) {
            if (entry === (checkName || saveName)) {
                return loopOverFiles(suffixCounter, saveName.replace(/^(.+?)(\..+)?$/, `$1-${suffixCounter}$2`))
            }
        }

        return checkName || saveName
    }

    let savePath = process.cwd() + '/' + _Envs.get('upload_parent_path') + '/' + subPath,
        saveName = filename || file.name || 'attachment'

    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath, {recursive: true})

    let files = fs.readdirSync(savePath);
    if (files.length !== 0) {
        saveName = loopOverFiles(0)
    }
    file.mv(savePath + '/' + saveName, function (err) {
        if (err) throw new Error(err)
    })

    return saveName
}

Number.prototype.toFixedTrunc = function (n) {
    let v = (typeof this === 'string' ? this : this.toString()).split('.')
    if (n <= 0) {
        return Number(v[0])
    }
    let f = v[1] || ''
    if (f.length > n) {
        return Number(`${v[0]}.${f.substr(0, n)}`)
    }
    while (f.length < n) f += '0'

    return Number(`${v[0]}.${f}`)
}

funcs.trimFloat = function (input, maxDigitAfterDecimal) {
    input = input.toFixedTrunc(maxDigitAfterDecimal) + ''
    if (!input.includes('.')) {
        return input
    }

    for (let i = input.length - 1; 0 <= i; i--) {
        if (input[i] === '.') {
            return input.substring(0, i)
        }
        if (input[i] !== '0') {
            return input
        }
        input = input.substring(0, i)
    }
}

module.exports = funcs