let _settings = {
    defaultLng: 'en',
}
$(function () {
    $('body')
        .on('input', 'input.input-fa-num', (e) => inputFaDigitsReplacer(e.target, 'onlyNumbers'))
        .on('input', 'input.input-fa, textarea.input-fa', (e) => inputFaDigitsReplacer(e.target))
        .on('input', 'input.input-fa-float', (e) => inputFaDigitsReplacer(e.target, 'float'))

        .on('click', '.tab-container .tab:not(.selected)', (e) => {
            let tabName = $(e.target).parents('.tab-container').attr('tab-name'),
                tabIndex = $(e.target).parents('.tab').attr('tab-index')
            $(e.target).parents('.tab-container').find('.selected').removeClass('selected')
            $(e.target).parents('.tab').addClass('selected')
            $(`[for-tab="${tabName}"]`).hide()
            $(`[for-tab="${tabName}"][tab-index="${tabIndex}"]`).show()
            $('body').scrollLeft(100000)
        })

    window.onresize = _.throttle(() => {
        document.body.style.height = window.innerHeight + 'px'
        document.body.style.width = window.innerWidth + 'px'
    }, 500)
    window.onresize()

    if (document.cookie.includes(`i18next`)) {
        _settings.lng = document.cookie.replace(/.*i18next=([^\s;]+)?.*/, '$1')
    } else {
        _settings.lng = _settings.defaultLng
    }
})

function setLanguage(lng) {
    document.cookie = `i18next=${lng}`
    window.location.reload()
}

const ERR_CODE_VALIDATION_NO_FILE_FOUND = 1
const Messages = {
    en: {
        operationSuccess: 'Success',
        operationFailed: 'Fail',
        networkError: 'Network Error',
        error: 'Error',
        failedLogout: 'Logout Failed',

        mustBeGreaterThan: (min) => `must be greater than ${min}`,
        mustBeLesserThan: (max) => `must be lesser than ${max}`,
        mustBeExactLengthNumbers: (len) => `must be ${len} numbers`,
        mustBeLongerThan: (minLen) => `must be at least ${minLen} characters`,
        mustBeShorterThan: (maxLen) => `must not be more than ${maxLen} characters`,
        mustBeExactLength: (len) => `must be ${len} characters long`,
        notConformWithFormat: 'not valid',
        mustBeFilled: `can't be empty`,
        mustBeNFiles: (len) => `${len} files must be selected`,
        fileSizeTooBig: `file size is too big`,
        mustSelectAnOption: `must select an option`,
    },
    fa: {
        operationSuccess: 'عملیات موفق',
        operationFailed: 'عملیات ناموفق',
        networkError: 'خطای شبکه',
        error: 'خطا',
        failedLogout: 'خروج ناموفق',

        mustBeGreaterThan: (min) => ` باید بیشتر از ${toFaDigit(min)} باشد`,
        mustBeLesserThan: (max) => `باید کمتر از ${toFaDigit(max)} باشد`,
        mustBeExactLengthNumbers: (len) => `باید ${toFaDigit(len)} عدد باشد`,
        mustBeLongerThan: (minLen) => `باید حداقل ${toFaDigit(minLen)} حرف/عدد باشد`,
        mustBeShorterThan: (maxLen) => `باید حداکثر ${toFaDigit(maxLen)} حرف/عدد باشد`,
        mustBeExactLength: (len) => `باید دقیقا ${toFaDigit(len)} حرف/عدد باشد`,
        notConformWithFormat: `معتبر نمی باشد`,
        mustBeFilled: `نمی تواند خالی باشد`,
        mustBeNFiles: (len) => `باید ${toFaDigit(len)} فایل انتخاب شود`,
        fileSizeTooBig: `حجم فایل بیش از حد مجاز`,
        mustSelectAnOption: `یک گزینه باید انتخاب شود`,
    },
}

const KiloByteSize = 1024,
    MegaByteSize = 1024 * 1024

const commonDataTableSettings = {
    dom: 'tpri',
    pageLength: 50,
    pagingType: 'numbers',
    lengthChange: false,
}

function initDataTableLocalize(tableSelectorStr) {
    $(tableSelectorStr).on('draw.dt', () => {
        convertNumToPersian('fa-num')
        convertNumToPersian('dataTables_paginate')
        convertNumToPersian('dataTables_info')
    })
}

function initDataTableColumnFilters(dataTable, options = {}) {
    let filterRowHTML = '<tr>',
        tableElement = dataTable.table().container()
    $('thead tr th', tableElement).each((index, entry) => {
        if (options.selectFilterColumn && options.selectFilterColumn[index]) {
            filterRowHTML += `<th><select class="header-search" data-column-index="${index}"><option></option>`
            for (let key in options.selectFilterColumn[index]) {
                filterRowHTML += `<option value="${key}">${options.selectFilterColumn[index][key]}</option>`
            }
            filterRowHTML += `</select></th>`
        } else {
            filterRowHTML += `<th><input type="search" class="header-search input-fa" data-column-index="${index}" ${$(entry).is('.no-filter') ? 'disabled' : ''} style="${$(entry).is('.filter-hide') ? 'visibility: hidden;' : ''}"></th>`
        }
    })
    filterRowHTML += '</tr>'
    let debouncedDataTableDraw = _.debounce(() => dataTable.draw(), 800)
    $('thead', tableElement).addClass('column-filters')
    setTimeout(() => {
        $('thead tr', tableElement).after(filterRowHTML)
        $('input.header-search', tableElement).on('input', (e) => {
            if (options.filterParams && dataTable.settings()[0].oFeatures.bServerSide) {
                if (!options.filterParams.search) options.filterParams.search = {}
                if (e.target.value === '') {
                    delete options.filterParams.search[$(e.target).data('column-index')]
                } else {
                    let searchParams = {
                        [$(e.target).data('column-index')]: toEnDigit(e.target.value, 'plain'),
                    }
                    _.assign(options.filterParams.search, searchParams)
                }
                if (Object.keys(options.filterParams.search).length === 0) {
                    delete options.filterParams.search
                }
                debouncedDataTableDraw()
            } else {
                dataTable.columns($(e.target).data('column-index')).search(toFaDigit(e.target.value)).draw()
            }
        })
        $('select.header-search', tableElement).on('change', (e) => {
            // currently only supports serverside searching
            if (options.filterParams && dataTable.settings()[0].oFeatures.bServerSide) {
                if (!options.filterParams.search) options.filterParams.search = {}
                let selectVal = e.target.value
                if (selectVal === '') {
                    delete options.filterParams.search[$(e.target).data('column-index')]
                } else {
                    let searchParams = {
                        [$(e.target).data('column-index')]: selectVal,
                    }
                    _.assign(options.filterParams.search, searchParams)
                }
                if (Object.keys(options.filterParams.search).length === 0) {
                    delete options.filterParams.search
                }
                dataTable.draw()
            }
        })
    }, 100)
}

function fetchBase(contentType, method, url, data, extraOptions = {}) {
    let {
        onSuccess = () => notif(Messages[_settings.lng].operationSuccess, 'success'),
        onSuccessTail = () => {
        },
        onFail = (data) => notif(data.errMsg ?? Messages[_settings.lng].operationFailed, 'fail'),
        onFailTail = (data) => {
        },
    } = extraOptions
    if (extraOptions.spinnerBtn) {
        spinnerBtn(extraOptions, true)
    }
    let isFetchSuccessful = false
    return fetch(url, {
        method,
        ...(contentType === 'json' && {headers: {'Content-Type': 'application/json'}}),
        body: data,
        ...(contentType === 'json' && {body: JSON.stringify(data)}),
    }).catch(e => {
        notif(Messages[_settings.lng].networkError, 'fail')
        throw new Error('NetworkError')
    }).then(async response => {
        return {
            ok: response.ok,
            data: await response.json(),
        }
    }).then(res => {
        if (res.ok) {
            isFetchSuccessful = true
            onSuccess(res.data)
            return onSuccessTail(res.data)
        } else {
            isFetchSuccessful = false
            onFail(res.data)
            return onFailTail(res.data)
        }
    }).finally(() => {
        if (extraOptions.spinnerBtn) {
            spinnerBtn(extraOptions, false, isFetchSuccessful)
        }
    })
}

function spinnerBtn({spinnerBtn: el, spinnerStopOnSuccess: stopOnSuccess}, set, isFetchSuccessful) {
    if (!$(el).is(`button, a.nav-btn`)) {
        return
    }
    if (set) {
        $(el).addClass('btn-in-progress').attr('disabled', '')
             .append(`<i class="fa-solid fa-spinner fa-spin"></i>`)
    } else {
        if ((isFetchSuccessful && stopOnSuccess !== false) || !isFetchSuccessful) {
            $(el).removeClass('btn-in-progress').removeAttr('disabled')
                 .find('.fa-spinner').remove()
        }
    }
}

function fetchJSON(method, url, data, extraOptions) {
    return fetchBase('json', method, url, data, extraOptions)
}

function postJSON(url, data, extraOptions) {
    return fetchJSON('POST', url, data, extraOptions)
}

function getJSON(url, onSuccess, onFail, queryParams) {
    let queryString = (new URLSearchParams(queryParams)).toString()
    if (queryString !== '') {
        queryString = '?' + queryString
    }
    return fetch(url + queryString, {
        method: 'GET',
    }).catch(e => {
        notif(Messages[_settings.lng].networkError, 'fail')
        throw new Error('NetworkError')
    }).then(async response => {
        return {
            ok: response.ok,
            data: await response.json(),
        }
    })
      .then(res => {
          if (res.ok) {
              return onSuccess(res.data)
          } else {
              return onFail(res.data)
          }
      })
}

function postForm(url, formData, extraOptions) {
    return fetchBase('form', 'POST', url, formData, extraOptions)
}

function redirectTo(path, delay = 0) {
    setTimeout(() => {
        window.location.assign(window.location.origin + path)
    }, delay)
}

function logout() {
    getJSON('/users/logout',
        () => window.location.assign(window.location.origin + '/users/login'),
        () => notif(Messages[_settings.lng].failedLogout, 'fail'),
        )
}

function notif(text, status, duration) {
    Toastify({
        text: text,
        duration: duration || 3000,
        newWindow: true,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: status === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" :
                status === "fail" ? "linear-gradient(to right, #ff5f6d, #ffc371)" :
                    status === "warning" ? "#a6c025" : "",
            'font-weight': 'bold',
            'font-size': '1.1em',
            direction: 'rtl',
        },
    }).showToast()
}

function convertNumToPersian(...classes) {
    let persian = {0: '۰', 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹'}

    function traverse(el) {
        if (el.nodeType === 3) {
            let list = el.data.match(/[0-9]/g)
            if (list != null && list.length !== 0) {
                for (let i = 0; i < list.length; i++)
                    el.data = el.data.replace(list[i], persian[list[i]])
            }
        }
        for (let i = 0; i < el.childNodes.length; i++) {
            traverse(el.childNodes[i])
        }
    }

    for (let entryClass of classes) {
        for (let node of $(`.${entryClass}`)) {
            traverse(node)
        }
    }
}

function toFaDigit(strIn, options = '') {
    return actualToFaDigit(strIn, options)
}

String.prototype.toFaDigit = function (options = '') {
    return actualToFaDigit(this, options)
}

function actualToFaDigit(strIn, options) {
    let str = ('' + strIn).replace(/\d+/g, function (digit) {
        let ret = ''
        for (let i = 0, len = digit.length; i < len; i++) {
            ret += String.fromCharCode(digit.charCodeAt(i) + 1728)
        }
        return ret
    })
    if (options.includes('price')) {
        str = str.replace(/[۰-۹]+/, function (digit) {
            let ret = ''
            for (let i = digit.length - 1, j = 0; i >= 0; i--, j++) {
                ret = digit[i] + (j % 3 === 0 && j !== 0 ? ',' : '') + ret
            }
            return ret
        })
    }
    if (options.includes('onlyNumbers')) {
        str = str.replace(/[^۰-۹.]+/g, '')
                 .replace(/\.(.*?)\./g, '.$1')
    }
    return str
}

function toEnDigit(strIn, options = '') {
    return actualToEnDigit(strIn, options)
}

String.prototype.toEnDigit = function (options = '') {
    return actualToEnDigit(this, options)
}

function actualToEnDigit(strIn, options) {
    let str = ('' + strIn).replace(/[۰-۹]+/g, function (digit) {
        let ret = ''
        for (let i = 0, len = digit.length; i < len; i++) {
            ret += String.fromCharCode(digit.charCodeAt(i) - 1728)
        }
        return ret
    })

    if (options.includes('plain')) {
        return str
    }

    if (options.includes('float')) {
        str = str.replace(/[^\d.]+/g, '')
    } else {
        str = str.replace(/\D+/g, '')
    }

    if (options.includes('num')) {
        str = Number(str)
    }

    return str
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

Number.prototype.moveDecimalPoint = function (n, toFixedTruncN) {
    // this function serves to safely multiply a float to integer in order to avoid floating point operation problem
    // e.g. 4.076 * 1000
    // toFixed() will not work here as it is actually rounding a number: (4.0759 * 1000).toFixed(0) = 4076
    if (n === 0) {
        return this
    }
    let v = (this + '').split('.'),
        vLen = v[0].length,
        f = v[1] || '',
        fLen = f.length,
        out
    if (n > 0) {
        if (fLen < n) {
            for (let i = 0; i < n - fLen; i++) {
                f += '0'
            }
        }
        out = Number(`${v[0]}${f.substr(0, n)}.${f.substr(n)}`)
    } else {
        if (vLen <= 0 - n) {
            for (let i = 0; i <= 0 - n - vLen; i++) {
                v[0] = '0' + v[0]
            }
            vLen = 0 - n + 1
        }
        out = Number(`${v[0].substr(0, vLen + n)}.${v[0].substr(vLen + n)}${f}`)
    }

    return toFixedTruncN === undefined ? out : out.toFixedTrunc(toFixedTruncN)
}

function trimFloat(input, maxDigitAfterDecimal) {
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

function hyphenToCamelCase(str) {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase())
}

function inputFaDigitsReplacer(targetNode, options = '') {
    let val = $(targetNode).val()
    if (options.includes('onlyNumbers')) {
        $(targetNode).val(toFaDigit(val.replace(/[^0-9۰-۹]/g, '')))
    } else if (options.includes('float')) {
        val = toFaDigit(val.replace(/[^0-9۰-۹.]/g, ''))
        if (/\.[۰-۹]*\./.test(val)) {
            val = val.replace(/(\.[۰-۹]*)\./, '$1')
        }
        if (!/^[۰-۹]+\.[۰-۹]*$/.test(val)) {
            val = val.replace(/\./g, '')
        }
        $(targetNode).val(val)
    } else {
        $(targetNode).val(toFaDigit(val))
    }
}

function formatPhoneNumber(phone) {
    if (/^(\d{4})(\d{3})(\d{4})$/.test(phone)) {
        phone = phone.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1-$2-$3')
        if (_settings.lng === 'fa') {
            phone = toFaDigit(phone)
        }
    }
    return phone
}

function renderDate(datetime) {
    let formattedDate
    if (_settings.lng === 'fa') {
        formattedDate = new persianDate(new Date(datetime)).format("YYYY/MM/DD - HH:mm:ss")
    } else {
        formattedDate = (new Date(datetime)).toLocaleString()
    }
    return formattedDate
}

function getReadableFileSize(size) {
    if (!size) {
        return ''
    } else if (size < KiloByteSize) {
        return `${size} Bytes`
    } else if (size < MegaByteSize) {
        return `${(size / KiloByteSize).toFixed(1)} KB`
    } else {
        return `${(size / MegaByteSize).toFixed(1)} MB`
    }
}

function setSelectOption(selector, value) {
    let selectEle = selector[0]
    for (let optionIndex in selectEle.options) {
        if (selectEle.options[optionIndex].value === value) {
            selectEle.selectedIndex = optionIndex
            break
        }
    }
}

async function validateInput(nodeSelector, options, additionalArgs) {
    let el = $(nodeSelector || 'body'),
        err = false,
        errMsg,
        errCode,
        finalVal

    for (let constraint of options.constraints) {
        switch (options.inputType) {
            case 'number':
            case 'float':
                let valNumber = el.find(options.selector).val().toEnDigit(options.inputType === 'float' ? 'num float' : 'num')
                if (constraint.min !== undefined && (valNumber === null || valNumber < constraint.min)) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].mustBeGreaterThan(constraint.min)
                } else if (constraint.max !== undefined && (valNumber === null || valNumber > constraint.max)) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].mustBeLesserThan(constraint.max)
                } else if (constraint.match !== undefined && (valNumber === null || !constraint.match.test(valNumber.toString()))) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].notConformWithFormat
                } else if (constraint.exactLen !== undefined && (valNumber === null || valNumber.toString().length !== constraint.exactLen)) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].mustBeExactLengthNumbers(constraint.exactLen)
                } else {
                    finalVal = valNumber
                }
                break
            case 'checkbox':
                let valCheckbox = el.find(options.selector)[0].checked
                finalVal = valCheckbox
                break
            case 'file':
                // only supports single file upload
                let files = el.find(options.selector)[0].files
                if (files.length === 0) {
                    err = true
                    errCode = ERR_CODE_VALIDATION_NO_FILE_FOUND
                    errMsg = constraint.errMsg || Messages[_settings.lng].mustBeFilled
                } else if (constraint.filesCount !== undefined && files.length !== constraint.filesCount) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].mustBeNFiles(constraint.filesCount)
                } else if (constraint.maxFileSize !== undefined && files[0].size > constraint.maxFileSize) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].fileSizeTooBig
                } else {
                    finalVal = files[0]
                }
                break
            case 'select':
                let valSelect = el.find(options.selector).val()
                if (valSelect === null) {
                    if (options.required === false) {
                        finalVal = undefined
                    } else {
                        err = true
                        errMsg = constraint.errMsg || Messages[_settings.lng].mustSelectAnOption
                    }
                } else {
                    if (options.valPreStore !== undefined) {
                        finalVal = options.valPreStore(valSelect, el)
                    } else {
                        finalVal = valSelect
                    }
                }
                break
            default: // text, email
                let valText = el.find(options.selector).val()
                if (valText === '' && options.required === false) {
                    finalVal = undefined
                    break
                }
                if (options.valPreApply !== undefined) {
                    valText = options.valPreApply(valText, el)
                }
                if (constraint.func && !(await constraint.func(valText))) {
                    err = true
                    errMsg = constraint.errMsg
                } else if (constraint.minLen !== undefined && (valText === null || valText.length < constraint.minLen)) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].mustBeLongerThan(constraint.minLen)
                } else if (constraint.maxLen !== undefined && (valText === null || valText.length > constraint.maxLen)) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].mustBeShorterThan(constraint.maxLen)
                } else if (constraint.exactLen !== undefined && (valText === null || valText.length !== constraint.exactLen)) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].mustBeExactLength(constraint.exactLen)
                } else if (constraint.match !== undefined && (valText === null || !constraint.match.test(valText))) {
                    err = true
                    errMsg = constraint.errMsg || Messages[_settings.lng].notConformWithFormat
                } else {
                    if (options.valPreStore !== undefined) {
                        finalVal = options.valPreStore(valText, el)
                    } else {
                        finalVal = valText
                    }
                }
                break
        }
    }
    // intraConstraints
    if (finalVal !== undefined) {
        for (let constraint of options.intraConstraints || []) {
            if (!constraint.validate(finalVal, additionalArgs)) {
                err = true
                errMsg = constraint.errMsg
                break
            }
        }
    }

    return {
        errStatus: err,
        errMessage: errMsg,
        errCode: errCode,
        value: finalVal,
    }
}

function validateEmail(email) {
    return _.isArray(String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        ))
}
