import { config } from '@config'
import sendEmail from '@utils/email'
import { EmailContextDto } from './email.dto'
const EmailTemplates = require('swig-email-templates')

const defaultContext = {
    clientName: config.emailNotification.EMAIL_PARAM_CLIENT_NAME,
    supportSiteEmail: config.emailNotification.EMAIL_PARAM_SUPPORT_EMAIL,
    supportSiteUrl: config.emailNotification.EMAIL_PARAM_SUPPORT_SITE_URL
}
const templates = new EmailTemplates({ root: config.EMAIL_TEMPLATES_ROOT_PATH })

export default class EmailService {
    static async sendRegistrationVerificationCode(context: EmailContextDto) {
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

    static async sendChangeEmailVerificationCode(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-change-email-verification-code.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendChangeEmailVerificationCode => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendChangeEmailVerificationCode => ' + err.message)
        })
    }

    static async sendUserVerificationCodeEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-verification.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendUserVerificationCodeEmail => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserVerificationCodeEmail => ' + err.message)
        })
    }

    static async sendUserForgotPasswordEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-password-reset-request.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendUserForgotPasswordEmail => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Password Reset Request`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserForgotPasswordEmail => ' + err.message)
        })
    }

    static async sendUserPasswordResetCompletedEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-password-reset-completed.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendUserPasswordResetCompletedEmail => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Password Reset Completed`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserPasswordResetCompletedEmail => ' + err.message)
        })
    }

    static async sendUserForgotPinEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-pin-reset-request.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendUserForgotPinEmail => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - PIN Reset Request`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserForgotPinEmail => ' + err.message)
        })
    }

    static async sendUserPinResetCompletedEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-pin-reset-completed.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendUserPinResetCompletedEmail => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - PIN Reset Completed`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserPinResetCompletedEmail => ' + err.message)
        })
    }

    static async sendUserChangeEmailCompletedEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-change-email-completed.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendUserChangeEmailCompletedEmail => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Verification Code`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserChangeEmailCompletedEmail => ' + err.message)
        })
    }

    static async sendUserResetCredentialsNotification(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-reset-credentials-request.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendUserResetCredentialsNotification => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Reset Credentials`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserResetCredentialsNotification => ' + err.message)
        })
    }

    static async sendUserResetCredentialsCompletedNotification(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-reset-credentials-completed.html', _context, function (err: any, html: string, text: string, subject: string) {
                if (err) {
                    console.error('sendUserResetCredentialsCompletedNotification => ' + err.message)
                }
                // Send email
                subject = `${config.emailNotification.EMAIL_PARAM_CLIENT_NAME} - Setup Credentials`
                sendEmail(subject, text, html, _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserResetCredentialsCompletedNotification => ' + err.message)
        })
    }
}
