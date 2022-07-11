const { Parser } = require('json2csv')
const Decimal = require('decimal.js')
const BigNumber = require('bignumber.js')
const shortid = require('shortid')
const { forEach, trim, map, uniqBy, isEmpty } = require('lodash')

export const unixTimestampToDate = (unixTimestamp: any) => {
    return new Date(unixTimestamp * 1000)
}

export const downloadResource = (res: any, fileName: string, fields: any, data: any) => {
    const json2csv = new Parser({ fields })
    const csv = json2csv.parse(data)
    res.header('Content-Type', 'text/csv')
    res.attachment(fileName)
    return res.send(csv)
}

export const generateRandomCode = (min: number, max: number, randomFlag?: boolean) => {
    let str: string = ''
    let range = min
    const arr = [
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'j',
        'k',
        'm',
        'n',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z'
    ]

    if (randomFlag) {
        range = Math.round(Math.random() * (max - min)) + min
    }
    for (let i = 0; i < range; i++) {
        const position = Math.round(Math.random() * (arr.length - 1))
        str += arr[position]
    }
    return str.toUpperCase()
}

export const roundUp = (num: any, precision = 8) => {
    if (!num) return 0
    precision = Math.pow(10, precision)
    return Math.round(num * precision) / precision
}
export const roundUpETH = (num: any) => {
    return roundUp(num, 18)
}

export const roundUpBTC = (num: any) => {
    return roundUp(num, 8)
}
export const toBigNumber = (value: any, precision: any) => {
    let number = new BigNumber(value)
    if (precision) {
        number = roundUp(value, precision)
    }
    return number
}
export const toBigNumberString = (value: any, precision: any) => {
    return toBigNumber(value, precision).toString()
}
export const floor = (num: any, precision: any) => {
    precision = Math.pow(10, precision)
    return Math.floor(num * precision) / precision
}
export const generateUnixTimestamp = () => {
    return Math.floor(new Date().getTime() / 1000)
}
export const randomInt = (min: any, max: any) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export const dateToUnixTimestamp = (time: any) => {
    const date = new Date(time)
    return Math.floor(date.getTime() / 1000)
}

export const toDecimal = (num: any, precision = 8) => {
    num = num ? num.toString() : '0'
    const decimal_num = new Decimal(num)
    const decimal_str = decimal_num.toDecimalPlaces(precision).toFixed(precision)
    const result = removeEndsZero(decimal_str)
    return result
}

export const maskString = (str: any, type: any) => {
    if (!str) return ''
    str = (str + '').replace(/^\s*|\s*$/g, '')
    if (type === 'email') {
        return str.replace(/([\d\D]{1})(.*)([\d\D]{1})(@\w+\.[a-z]+(\.[a-z]+)?)/, '$1****$3$4')
    }
    if (type === 'phone') {
        return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }
    return str.replace(/([\d\D]{1})(.*)/, '$1**')
}

export const generateShortId = () => {
    return shortid.generate().toLowerCase()
}

export const removeEndsZero: (value: any) => any = (value: any) => {
    if (value.length === 1) {
        return value
    }
    if (value.endsWith('.')) {
        return value.substring(0, value.length - 1)
    } else if (value.endsWith('0')) {
        return removeEndsZero(value.substring(0, value.length - 1))
    }
    return value
}

export const formatExternalProductAttributes = (traits: any) => {
    if (!traits) return []
    return map(traits, (trait: any) => {
        return {
            trait_type: trait.trait_type,
            value: trait.value
        }
    })
}
