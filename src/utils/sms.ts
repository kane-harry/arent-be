import { config } from '@config'
import { stripPhoneNumber } from '@utils/phone-helper'

async function sendSms(subject: string, text: string, html: string, address: string) {
    const AWS = require('aws-sdk')

    AWS.config.update({ accessKeyId: config.amazonS3.key, secretAccessKey: config.amazonS3.secret })
    AWS.config.update({ region: 'ap-southeast-1' })

    try {
        const strippedPhoneNumber = await stripPhoneNumber(address)
        const sns = new AWS.SNS()
        const params = {
            Message: html,
            MessageStructure: 'string',
            PhoneNumber: strippedPhoneNumber,
            Subject: subject
        }

        const data = await sns.publish(params).promise()
        console.log('sms:send | ' + JSON.stringify(data))

        return true
    } catch (err: any) {
        console.error('sms:send error | ' + err.stack)
        return false
    }
}

export default sendSms