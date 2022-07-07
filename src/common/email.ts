import { config } from '@config'

async function sendEmail(subject: string, text: string, html: string, address: string) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`sending email to ${address}, content: ${html}`)
        // return
    }

    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(config.emailNotification.emailSendgridApiKey)
    const msg = {
        to: address,
        from: config.emailNotification.fromAddress,
        subject: subject,
        text: text,
        html: html
    }
    try {
        await sgMail.send(msg)
    } catch (error) {
        // Log friendly error
        console.error(error)
    }
}

export default sendEmail
