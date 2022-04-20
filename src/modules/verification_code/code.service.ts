import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { AuthErrors } from '@exceptions/custom.error'
import { toLower, trim } from 'lodash'
import moment from 'moment'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import { VerificationCode } from './code.model'
import UserModel from '@modules/user/user.model'
import { CodeType } from './code.interface'

export default class VerificationCodeService {
    static async generateCode(params: CreateCodeDto) {
        const email = toLower(trim(params.email))
        const user = await UserModel.findOne({ email: params.email }).exec()
        if (user) {
            if (params.codeType === CodeType.EmailRegistration) {
                throw new BizException(AuthErrors.registration_email_exists_error, new ErrorContext('auth.service', 'generateCode', { email: email }))
            }
            if (user.emailVerified && params.codeType === CodeType.EmailUpdating) {
                throw new BizException(
                    AuthErrors.registration_email_already_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { email: email })
                )
            }
        }
        const code = VerificationCode.generate({ length: 6, charset: 'numeric' })
        const codeData = await VerificationCode.findOne({ owner: email, type: params.codeType }).exec()
        const currentTs = moment().unix()
        if (codeData) {
            if (codeData.sentAttempts <= 5 && codeData.sentTimestamp > currentTs - 60) {
                throw new BizException(
                    AuthErrors.verification_code_duplicate_request_in_minute_error,
                    new ErrorContext('verification_code.service', 'generateCode', { email: email })
                )
            } else if (codeData.sentAttempts > 5 && codeData.sentTimestamp > currentTs - 3600) {
                throw new BizException(
                    AuthErrors.verification_code_duplicate_request_in_hour_error,
                    new ErrorContext('verification_code.service', 'generateCode', { email: email })
                )
            }
            const newExpireTimestamp = currentTs + 900
            await VerificationCode.findByIdAndUpdate(codeData._id, {
                code: code,
                expiryTimestamp: newExpireTimestamp,
                sentAttempts: codeData.sentAttempts++,
                enabled: true
            }).exec()
        } else {
            const mode = new VerificationCode({
                owner: email,
                type: params.codeType,
                code: code
            })
            await mode.save()
        }
        // TODO: send email

        return { success: true }
    }

    static async verifyCode(params: VerifyCodeDto) {
        const codeData = await VerificationCode.findOne({ owner: params.email, type: params.codeType, code: params.code }).exec()

        if (!codeData) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('verification_code.service', 'generateCode', { code: params.code })
            )
        }
        const currentTs = moment().unix()
        if (!codeData.enabled || codeData.expiryTimestamp < currentTs) {
            throw new BizException(
                AuthErrors.verification_code_invalid_error,
                new ErrorContext('verification_code.service', 'generateCode', { code: params.code })
            )
        }
        const valid = codeData.code === params.code
        if (valid) {
            await VerificationCode.findByIdAndUpdate(codeData._id, { enabled: false }).exec()
        } else {
            const retryAttempts = codeData.retryAttempts + 1
            const codeEnabled = retryAttempts > 5
            await VerificationCode.findByIdAndUpdate(codeData._id, { retryAttempts: retryAttempts, enabled: codeEnabled }).exec()
        }

        return { success: valid }
    }
}
