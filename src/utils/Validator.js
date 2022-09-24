const funcs = {}
const ValidationErrorPreMessage = 'Validation Error:\n'

class ValidationError extends _Errors.AppError {
    constructor(message) {
        super(_Errors.REQUEST_VALIDATION_FAIL, ValidationErrorPreMessage + message)
    }
}

funcs.validate = async function (data, schema) {
    let container
    switch (schema.objectType) {
        case 'object':
            if (!_.isPlainObject(data)) {
                throw new ValidationError(`(objectType: object) input not an object \ninput: ${JSON.stringify(data)}`)
            }
            let ruleSets,
                ruleSetPassed = false,
                msg = '',
                isMoreThanOneRuleSet = true
            if (!schema.rules) {
                ruleSets = [schema]
                isMoreThanOneRuleSet = false
            } else {
                ruleSets = schema.rules
            }
            // rules are OR'ed
            for (let ruleSet of ruleSets) {
                try {
                    container = {}
                    for (let key in ruleSet) {
                        if (['objectType', 'intraKeyRules', 'optionalRule',
                             'doNotReturn', 'manualReturn', 'dynamicProperties'].includes(key)) {
                            // these are reserved keys for validation settings
                        } else if (_.isPlainObject(ruleSet[key]) && _.isString(ruleSet[key].objectType)) {
                            if (data[key] === undefined && ruleSet[key].optionalRule === true) {
                                continue
                            }
                            let subValidatedData = await funcs.validate(data[key], ruleSet[key])
                            if (ruleSet[key].doNotReturn !== true) {
                                container[key] = subValidatedData
                            }
                        } else if (data[key] !== undefined) {
                            let optionalProperty = false,
                                propertyPassedValidation = true
                            for (let func of ruleSet[key]) {
                                if (func === 'optional') {
                                    // NOTE: optional rules (including optionalRule) do not throw error on invalid values,
                                    // so cases of missing values and invalid values are indistinguishable
                                    optionalProperty = true
                                } else if (!await func(data[key])) {
                                    if (optionalProperty) {
                                        propertyPassedValidation = false
                                        break
                                    } else {
                                        throw new ValidationError(`(objectType: object) invalid input on key: ${key}\ninput: ${JSON.stringify(data)}`)
                                    }
                                }
                            }
                            if (propertyPassedValidation && ruleSet.doNotReturn !== true) {
                                container[key] = data[key]
                            }
                        } else if (ruleSet[key][0] !== 'optional') {
                            throw new ValidationError(`(objectType: object) missing key: ${key}\ninput: ${JSON.stringify(data)}`)
                        }
                    }
                    // NOTE: properties in dynamicProperties do not throw error on invalid values, they are simply not included in returned object
                    // also currently this section does not support nesting
                    if (ruleSet.dynamicProperties) {
                        for (let key in data) {
                            if (ruleSet[key]) {
                                continue
                            }
                            let propertyPassedValidation = true
                            for (let func of ruleSet.dynamicProperties.keys) {
                                if (!await func(key)) {
                                    propertyPassedValidation = false
                                    break
                                }
                            }
                            if (!propertyPassedValidation) {
                                continue
                            }
                            for (let func of ruleSet.dynamicProperties.values) {
                                if (!await func(data[key])) {
                                    propertyPassedValidation = false
                                    break
                                }
                            }
                            if (propertyPassedValidation) {
                                container[key] = data[key]
                            }
                        }
                    }
                    if (ruleSet.intraKeyRules) {
                        for (let intraKeyRule of ruleSet.intraKeyRules) {
                            if (!(await intraKeyRule(data))) {
                                throw new ValidationError(`(objectType: object) intraKeyRule failed \ninput: ${JSON.stringify(data)}`)
                            }
                        }
                    }
                    ruleSetPassed = true
                    break
                } catch (e) {
                    msg += e.message.replace(ValidationErrorPreMessage, '') + '\nOR\n'
                }
            }
            if (!ruleSetPassed) {
                if (isMoreThanOneRuleSet) {
                    throw new ValidationError(msg.replace(/OR\n$/, '')
                        + `(objectType: object) none of ruleSets passed \ninput: ${JSON.stringify(data)}`)
                } else {
                    throw new ValidationError(msg.replace(/OR\n$/, ''))
                }
            } else {
                if (isMoreThanOneRuleSet && schema.intraKeyRules) {
                    for (let intraKeyRule of schema.intraKeyRules) {
                        if (!(await intraKeyRule(data))) {
                            throw new ValidationError(`(objectType: object) outer intraKeyRule failed \ninput: ${JSON.stringify(data)}`)
                        }
                    }
                }
            }
            // this is also good for dynamic objects which we don't know or don't want to specify each key for in the schema separately
            if (schema.manualReturn) {
                return schema.manualReturn(data)
            }
            //NOTE: we are not checking the additional keys that are not defined in schema
            return container
        case 'array':
            if (!_.isArray(data)) {
                throw new ValidationError(`expected an array (objectType: array) \ninput: ${JSON.stringify(data)}`)
            }
            container = []
            for (let arrayEntry of data) {
                let ruleSetPassed = false,
                    validatedOutput, msg = ''
                // rules are OR'ed
                for (let ruleSet of schema.rules) {
                    try {
                        validatedOutput = await funcs.validate(arrayEntry, ruleSet, true)
                        ruleSetPassed = true
                        break
                    } catch (e) {
                        msg += e.message.replace(ValidationErrorPreMessage, '') + '\nOR\n'
                    }
                }
                if (!ruleSetPassed) {
                    throw new ValidationError(msg.replace(/OR\n$/, '')
                        + `(objectType: array) none of ruleSets passed \ninput: ${JSON.stringify(arrayEntry)}`)
                }
                container.push(validatedOutput)
            }
            if (schema.arrayRules) {
                for (let func of schema.arrayRules) {
                    if (!await func(data)) {
                        throw new ValidationError(`(objectType: array) arrayRules failed \ninput: ${JSON.stringify(data)}`)
                    }
                }
            }
            return container
        case 'plain':
            for (let func of schema.rules) {
                if (!(await func(data))) {
                    throw new ValidationError(`(objectType: plain) invalid input: ${JSON.stringify(data)}`)
                }
            }
            return data
        default:
            throw new Error(`invalid objectType: ${schema.objectType}`)
    }
}

funcs.errorIfKeyMissing = function (data, key) {
    if (_.isNil(data[key])) {
        throw new Error(`missing key(${key}) in data(${JSON.stringify(data)})`)
    }
}

funcs.orConditions = function (...funcGroups) {
    return async (val) => {
        for (let funcGroup of funcGroups) {
            let falseReturn = false
            for (let func of funcGroup) {
                if (!func(val)) {
                    falseReturn = true
                    break
                }
            }
            if (!falseReturn) {
                return true
            }
        }
        return false
    }
}

funcs.existingId = function (model, innerChecking) {
    return async id => {
        return model
            .findById(id)
            .then(findObj => {
                return innerChecking(findObj)
            }).catch(e => {
                return false
            })
    }
}

funcs.existingByField = function (model, field) {
    return val => model.exists({[field]: val})
}

funcs.existingByFilter = function (model, filter) {
    return val => model.exists(filter(val))
}

funcs.gt = function (ref) {
    return val => {
        return val > ref
    }
}

funcs.min = function (min) {
    return val => {
        return val >= min
    }
}

funcs.max = function (max) {
    return val => {
        return val <= max
    }
}

funcs.minLen = function (minLength) {
    return str => {
        return str.length >= minLength
    }
}

funcs.maxLen = function (maxLength) {
    return str => {
        return str.length <= maxLength
    }
}

funcs.exactLen = function (exactLength) {
    // be careful with numbers starting with 0
    return str => {
        if (_.isArray(str)) {
            return str.length === exactLength
        }
        return str.toString().length === exactLength
    }
}

funcs.regMatch = function (regex) {
    return (str) => {
        return regex.test(str)
    }
}

funcs.isIn = function (collection) {
    if (_.isArray(collection)) {
        return (searchTarget) => collection.includes(searchTarget)
    } else {
        return (searchTarget) => Object.keys(collection).includes(searchTarget)
    }
}

funcs.isUnixTimestamp = function () {
    return (unixTimestamp) => {
        return new Date(unixTimestamp).getTime() > 0
    }
}

funcs.maxFileAsStringSize = function (maxSize) {
    return (str) => Buffer.byteLength(str, 'utf8') <= maxSize
}

funcs.validateEmail = function (email) {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
}

module.exports = funcs