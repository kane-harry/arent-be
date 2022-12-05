import { config } from '@config'
import { getPhoneInfo } from '@utils/phoneNumber'
import BizException from '@exceptions/biz.exception'
import { AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'

async function sendSms(subject: string, contents: string, phoneNumber: string) {
    const AWS = require('aws-sdk')

    AWS.config.update({ accessKeyId: config.amazonS3.key, secretAccessKey: config.amazonS3.secret })
    AWS.config.update({ region: 'ap-southeast-1' })

    try {
        const phoneInfo = getPhoneInfo(phoneNumber)
        if (!phoneInfo.is_valid) {
            throw new BizException(AuthErrors.invalid_phone, new ErrorContext('sms', 'sendSms', { phone: phoneNumber }))
        }
        const strippedPhoneNumber = phoneInfo.phone
        const sns = new AWS.SNS()
        const params = {
            Message: contents,
            MessageStructure: 'string',
            PhoneNumber: strippedPhoneNumber,
            Subject: subject
        }

        const data = await sns.publish(params).promise()
        if (process.env.NODE_ENV !== 'production') {
            console.log('sms:send | ' + JSON.stringify(data))
        }
        return true
    } catch (err: any) {
        console.error('sms:send error | ' + err.stack)
        return false
    }
}

export default sendSms
