import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { AuthErrors } from '@exceptions/custom.error'
import { toLower, trim } from 'lodash'
import moment from 'moment'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import { VerificationCode } from './code.model'
import UserModel from '@modules/user/user.model'
import { CodeType } from './code.interface'
import crypto from 'crypto'
import sendEmail from '@common/email'
import sendSms from '@common/sms'

export default class VerificationCodeService {
    static async generateCode(params: CreateCodeDto) {
        const owner = toLower(trim(params.owner))
        const filter = {
            $or: [{ email: params.owner }, { phone: params.owner }]
        }
        const user = await UserModel.findOne(filter).exec()
        if (user) {
            if (params.codeType === CodeType.EmailRegistration) {
                throw new BizException(AuthErrors.registration_email_exists_error, new ErrorContext('auth.service', 'generateCode', { owner: owner }))
            }
            if (user.emailVerified && params.codeType === CodeType.EmailUpdate) {
                throw new BizException(
                    AuthErrors.registration_email_already_verified_error,
                    new ErrorContext('auth.service', 'generateCode', { owner: owner })
                )
            }
        }
        const code = VerificationCode.generate({ length: 6, charset: 'numeric' })
        const codeData = await VerificationCode.findOne({ owner: owner, type: params.codeType }).exec()
        const currentTs = moment().unix()
        if (codeData) {
            if (codeData.sentAttempts <= 5 && codeData.sentTimestamp > currentTs - 60 && process.env.NODE_ENV !== 'development') {
                throw new BizException(
                    AuthErrors.verification_code_duplicate_request_in_minute_error,
                    new ErrorContext('verification_code.service', 'generateCode', { owner: owner })
                )
            } else if (codeData.sentAttempts > 5 && codeData.sentTimestamp > currentTs - 3600) {
                throw new BizException(
                    AuthErrors.verification_code_duplicate_request_in_hour_error,
                    new ErrorContext('verification_code.service', 'generateCode', { owner: owner })
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
                key: crypto.randomBytes(16).toString('hex'),
                owner: owner,
                type: params.codeType,
                code: code,
                expiryTimestamp: moment().add(15, 'minutes').unix()
            })
            await mode.save()
        }
        const subject = 'Welcome to LightLink'
        const text = ''
        const html = `This is your ${params.codeType} verification code: <b>${code}</b>`
        switch (params.codeType) {
        case CodeType.SMSLogIn:
        case CodeType.SMS:
            await sendSms(subject, html, html, owner)
            break
        default:
            await sendEmail(subject, html, html, owner)
            break
        }

        if (process.env.NODE_ENV === 'development') {
            return { success: true, code: code }
        }
        return { success: true }
    }

    static async verifyCode(params: VerifyCodeDto) {
        const codeData = await VerificationCode.findOne({ owner: params.owner, type: params.codeType, code: params.code }).exec()

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
