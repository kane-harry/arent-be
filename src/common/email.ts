import {config} from '@config'

function sendEmail(subject: string, text: string, html: string, address: string) {
    if (process.env.NODE_ENV != 'production') {
        console.log('sending email ..');
        console.log('from => ' + config.emailNotification.fromAddress);
        console.log('to => ' + address);
        console.log('subject => ' + subject);
        console.log('text => ' + text);
        console.log('html => ' + html);
        return;
    }

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.emailNotification.emailSendgridApiKey);
    const msg = {
        to: address,
        from: config.emailNotification.fromAddress,
        subject: subject,
        text: text,
        html: html,
    };
    sgMail.send(msg).then(() => {
        //Celebrate
    })
        .catch(function (error: any) {
            //Log friendly error
            console.error(error.toString());
            //Extract error msg
            const {message, code, response} = error;
            //Extract response msg
            const {headers, body} = response;
        })
}

export default sendEmail
