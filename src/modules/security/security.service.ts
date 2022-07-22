import { CodeType } from '@config/constants'
import BizException from '@exceptions/biz.exception'
import { AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { MFAType } from '@modules/auth/auth.interface'
import EmailService from '@modules/emaill/email.service'
import UserModel from '@modules/user/user.model'
import VerificationCodeService from '@modules/verification_code/code.service'
import sendSms from '@utils/sms'
import { verifyToken } from '@utils/totp'

export default class SecurityService {
    public static async validate2FA(userKey: string, codeType: CodeType, code: string) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).select('key email phone mfa_settings').exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('security.service', 'validate2FA', { userKey }))
        }
        let mfaEnabled = false
        if (user.mfa_settings) {
            if (user.mfa_settings.login_enabled && codeType === CodeType.Login) {
                mfaEnabled = true
            } else if (user.mfa_settings.withdraw_enabled && codeType === CodeType.Withdraw) {
                mfaEnabled = true
            }
        }
        if (!mfaEnabled) {
            return { status: 'verified' }
        }
        const mfaType = user.mfa_settings.mfa_type
        if (!code || !code.length || code === 'undefined') {
            const deliveryMethod = (owner: any, code: string) => {
                if (mfaType === MFAType.EMAIL) {
                    const context = { address: user.email, code }
                    EmailService.sendUserVerificationCodeEmail(context)
                } else if (mfaType === MFAType.SMS) {
                    sendSms('Verification', `Verification code - ${code}`, user.phone)
                } else if (mfaType === MFAType.TOTP) {
                    // do nothing
                }
            }

            await VerificationCodeService.generateCode({ owner: user.key, user_key: user.key, code_type: codeType }, deliveryMethod)
            return { require_mfa_code: true, type: mfaType, status: 'sent' }
        }

        if (mfaType === MFAType.TOTP) {
            const twoFactorSecret = String(user?.get('two_factor_secret', null, { getters: false }))
            if (!verifyToken(twoFactorSecret, code)) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('security.service', 'validate2FA', {}))
            }
        } else {
            await VerificationCodeService.verifyCode({ owner: user.key, code, code_type: codeType })
        }

        return { require_mfa_code: true, type: mfaType, status: 'verified' }
    }
}
