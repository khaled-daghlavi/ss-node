const x = {
    t: {
        en: require('../locales/en-trans.json'),
        fa: require('../locales/fa-trans.json'),
    },
}

x.clearCollection = async function (modelName) {
    return _Models[modelName].deleteMany({})
}

module.exports = x