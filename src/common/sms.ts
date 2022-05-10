import {config} from "@config";
import stripPhoneNumber from 'common/phone-helper'

async function sendSms(subject: string, text: string, html: string, address: string) {
    var AWS = require('aws-sdk');

    AWS.config.update({accessKeyId: config.amazonS3.key, secretAccessKey: config.amazonS3.secret});
    AWS.config.update({region: 'ap-southeast-1'});

    try {
        const strippedPhoneNumber = await stripPhoneNumber(address);
        var sns = new AWS.SNS();
        var params = {
            Message: html,
            MessageStructure: 'string',
            PhoneNumber: strippedPhoneNumber,
            Subject: subject
        };

        const data = await sns.publish(params).promise();
        // console.log('sms:send | ' + JSON.stringify(data));

        return true;
    } catch (err: any) {
        console.error('sms:send | ' + err.stack);
        return false;
    }
}

export default sendSms
