const { Parser } = require('json2csv')

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
