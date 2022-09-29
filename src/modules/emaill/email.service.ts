import { config } from '@config'
import sendEmail from '@utils/email'
import { EmailContextDto } from './email.dto'
import EmailTemplates from 'swig-email-templates'

const defaultContext = {
    clientName: config.emailNotification.emailParamClientName,
    supportSiteEmail: config.emailNotification.emailParamSupportEmail,
    supportSiteUrl: config.emailNotification.emailParamSupportSiteUrl
}
const templates = new EmailTemplates({ root: config.emailTemplatesRootPath })

export default class EmailService {
    static async sendUserAuthVerificationCode(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-auth-verification-code.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Verification Code`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserAuthVerificationCode => ' + err.message)
        })
    }

    static async sendRegistrationVerificationCode(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-registration-verification-code.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Verification Code`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendRegistrationVerificationCode => ' + err.message)
        })
    }

    static async sendChangeEmailVerificationCode(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-change-email-verification-code.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Verification Code`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendChangeEmailVerificationCode => ' + err.message)
        })
    }

    static async sendUserVerificationCodeEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-verification.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Verification Code`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserVerificationCodeEmail => ' + err.message)
        })
    }

    static async sendUserForgotPasswordEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-password-reset-request.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Password Reset Request`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserForgotPasswordEmail => ' + err.message)
        })
    }

    static async sendUserPasswordResetCompletedEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-password-reset-completed.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Password Reset Completed`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserPasswordResetCompletedEmail => ' + err.message)
        })
    }

    static async sendUserForgotPinEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-pin-reset-request.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - PIN Reset Request`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserForgotPinEmail => ' + err.message)
        })
    }

    static async sendUserPinResetCompletedEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-pin-reset-completed.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - PIN Reset Completed`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserPinResetCompletedEmail => ' + err.message)
        })
    }

    static async sendUserChangeEmailCompletedEmail(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-change-email-completed.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Verification Code`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserChangeEmailCompletedEmail => ' + err.message)
        })
    }

    static async sendUserResetCredentialsNotification(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-reset-credentials-request.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Reset Credentials`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserResetCredentialsNotification => ' + err.message)
        })
    }

    static async sendUserResetCredentialsCompletedNotification(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('user-reset-credentials-completed.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Setup Credentials`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendUserResetCredentialsCompletedNotification => ' + err.message)
        })
    }

    static async sendPurchaseProductSuccessNotification(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('product-purchase.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Nft Purchased`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendPurchaseProductSuccessNotification => ' + err.message)
        })
    }

    static async sendSaleProductSuccessNotification(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('product-sold.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Nft Sold`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendSellProductSuccessNotification => ' + err.message)
        })
    }

    static async sendOutbidNotification(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('outbid-notification.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Bidding Notification`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendOutbidNotification => ' + err.message)
        })
    }

    static async sendReceivedOfferNotification(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('product-offer-received.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Offer received`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendReceivedOfferNotification => ' + err.message)
        })
    }

    static async sendEmailVerificationCode(context: EmailContextDto) {
        const _context = Object.assign({}, context, defaultContext)

        await new Promise((resolve, reject) => {
            templates.render('email-verification.html', _context, (err: any, html?: string, text?: string, subject?: string) => {
                if (err) {
                    reject(err)
                }
                // Send email
                subject = `${config.emailNotification.emailParamClientName} - Email Verification Code`
                sendEmail(subject, String(text), String(html), _context.address)
                resolve('done')
            })
        }).catch(err => {
            console.error('sendEmailVerificationCode => ' + err.message)
        })
    }
}
