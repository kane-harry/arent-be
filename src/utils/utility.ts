const { Parser } = require('json2csv')

export const unixTimestampToDate = (unixTimestamp: any) => {
    return new Date(unixTimestamp * 1000)
}

export const downloadResource = (res:any, fileName:string, fields:any, data:any) => {
    const json2csv = new Parser({ fields })
    const csv = json2csv.parse(data)
    res.header('Content-Type', 'text/csv')
    res.attachment(fileName)
    return res.send(csv)
}
