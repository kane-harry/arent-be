import BizException from '@exceptions/biz.exception'
import { AuthErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { MFAType } from '@modules/auth/auth.interface'
import EmailService from '@modules/emaill/email.service'
import UserModel from '@modules/user/user.model'
import { CodeType } from '@modules/verification_code/code.interface'
import VerificationCodeService from '@modules/verification_code/code.service'
import sendSms from '@utils/sms'
import { verifyToken } from '@utils/totp'

export default class SecurityService {
    public static async validate2FA(userKey: string, codeType: CodeType, code: string) {
        const user = await UserModel.findOne({ key: userKey, removed: false }).select('key email phone MFASettings').exec()
        if (!user) {
            throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('security.service', 'validate2FA', { userKey }))
        }
        let mfaEnabled = false
        if (user.mfaSettings) {
            if (user.mfaSettings.loginEnabled && codeType === CodeType.Login) {
                mfaEnabled = true
            } else if (user.mfaSettings.withdrawEnabled && codeType === CodeType.Withdraw) {
                mfaEnabled = true
            }
        }
        if (!mfaEnabled) {
            return { status: 'verified' }
        }
        const mfaType = user.mfaSettings.MFAType
        if (!code || !code.length || code === 'undefined') {
            const codeInfo = await VerificationCodeService.generateCode({ owner: user.key, userKey: user.key, codeType: codeType })
            if (codeInfo.success) {
                if (mfaType === MFAType.EMAIL) {
                    const context = { address: user.email, code: codeInfo.code }
                    EmailService.sendUserVerificationCodeEmail(context)
                } else if (mfaType === MFAType.SMS) {
                    sendSms('Verification', `Verification code - ${codeInfo.code}`, user.phone)
                } else if (mfaType === MFAType.TOTP) {
                    // do nothing
                }
            }
            return { requireMFACode: true, type: mfaType, status: 'sent' }
        }

        if (mfaType === MFAType.TOTP) {
            const twoFactorSecret = String(user?.get('twoFactorSecret', null, { getters: false }))
            if (!verifyToken(twoFactorSecret, code)) {
                throw new BizException(AuthErrors.token_error, new ErrorContext('security.service', 'validate2FA', {}))
            }
        } else {
            await VerificationCodeService.verifyCode({ owner: user.key, code, codeType })
        }

        return { requireMFACode: true, type: mfaType, status: 'verified' }
    }
}
