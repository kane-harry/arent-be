import { config } from '@config'
import sendEmail from '@utils/email'
import { ContextMailDto } from './email.dto'
const EmailTemplates = require('swig-email-templates')

const defaultContext = {
    clientName: config.emailNotification.EMAIL_PARAM_CLIENT_NAME,
    // clientName2: constants.email.template.EMAIL_PARAM_CLIENT_NAME2,
    // supportSiteUrl: constants.email.template.EMAIL_PARAM_SUPPORT_SITE_URL,
    supportSiteEmail: config.emailNotification.fromAddress
    // verifyAccountUrl: constants.email.template.EMAIL_PARAM_VERIFY_ACCOUNT_URL
}
const templates = new EmailTemplates({ root: config.EMAIL_TEMPLATES_ROOT_PATH })

export default class EmailService {
    static async sendRegistrationVerificationCode(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-registration-verification-code.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendEmailUpdateComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendRegistrationVerificationCode => ' + err.message)
        })
    }

    static async sendLoginVerificationCode(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-verification.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendEmailUpdateComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendLoginVerificationCode => ' + err.message)
        })
    }

    static async sendPasswordResetCode(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('password-reset-request.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendEmailUpdateComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendPasswordResetCode => ' + err.message)
        })
    }

    static async sendPasswordResetComplete(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('password-reset-complete.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendEmailUpdateComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendPasswordResetComplete => ' + err.message)
        })
    }

    static async sendPinResetCode(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('pin-reset-request.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendEmailUpdateComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendPinResetCode => ' + err.message)
        })
    }

    static async sendPinResetComplete(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('pin-reset-complete.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendEmailUpdateComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendPinResetComplete => ' + err.message)
        })
    }

    static async sendEmailUpdateCode(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('email-update-request.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendEmailUpdateComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendEmailUpdateCode => ' + err.message)
        })
    }

    static async sendEmailUpdateComplete(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('email-update-complete.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendEmailUpdateComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendEmailUpdateComplete => ' + err.message)
        })
    }

    static async sendResetCredentialsComplete(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('reset-credentials-complete.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendResetCredentialsComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Reset Credentials`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendResetCredentialsComplete => ' + err.message)
        })
    }

    static async sendSetupCredentialsComplete(context: ContextMailDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('setup-credentials-complete.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendSetupCredentialsComplete => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Setup Credentials`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendSetupCredentialsComplete => ' + err.message)
        })
    }
}
