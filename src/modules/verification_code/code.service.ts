import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { AuthErrors, VerificationCodeErrors } from '@exceptions/custom.error'
import { toLower, trim } from 'lodash'
import moment from 'moment'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import { VerificationCode } from './code.model'
import UserModel from '@modules/user/user.model'
import { CodeType } from './code.interface'
import crypto from 'crypto'
import { stripPhoneNumber } from '@utils/phone-helper'

export default class VerificationCodeService {
    static async generateCode(params: CreateCodeDto) {
        if ([CodeType.PhoneRegistration, CodeType.PhoneUpdate].includes(params.codeType)) {
            params.owner = await stripPhoneNumber(params.owner)
        }
        const owner = toLower(trim(params.owner))

        // check duplicate user for registration and update email/phone
        if ([CodeType.PhoneRegistration, CodeType.EmailRegistration, CodeType.EmailUpdate, CodeType.PhoneUpdate].includes(params.codeType)) {
            const filter = {
                $or: [{ email: params.owner }, { phone: params.owner }]
            }
            const user = await UserModel.findOne(filter).select('key email phone').exec()
            if (user) {
                if (params.codeType === CodeType.EmailRegistration || params.codeType === CodeType.EmailUpdate) {
                    throw new BizException(
                        AuthErrors.registration_email_exists_error,
                        new ErrorContext('auth.service', 'generateCode', { owner: owner })
                    )
                } else {
                    throw new BizException(
                        AuthErrors.registration_phone_exists_error,
                        new ErrorContext('auth.service', 'generateCode', { owner: owner })
                    )
                }
            }
        }

        const code = VerificationCode.generate({ length: 6, charset: 'numeric' }, owner)
        const codeData = await VerificationCode.findOne({ owner: owner, type: params.codeType }).exec()
        const currentTs = moment().unix()
        if (codeData) {
            if (codeData.sentAttempts <= 5 && codeData.sentTimestamp > currentTs - 60 && process.env.NODE_ENV !== 'development') {
                throw new BizException(
                    VerificationCodeErrors.verification_code_duplicate_request_in_minute_error,
                    new ErrorContext('verification_code.service', 'generateCode', { owner: owner })
                )
            } else if (codeData.sentAttempts > 5 && codeData.sentTimestamp > currentTs - 3600) {
                throw new BizException(
                    VerificationCodeErrors.verification_code_duplicate_request_in_hour_error,
                    new ErrorContext('verification_code.service', 'generateCode', { owner: owner })
                )
            }
            const sentAttempts = codeData.sentAttempts + 1
            const newExpireTimestamp = currentTs + 900
            await VerificationCode.findByIdAndUpdate(codeData._id, {
                code: code,
                expiryTimestamp: newExpireTimestamp,
                sentAttempts: sentAttempts,
                verified: false,
                enabled: true
            }).exec()
        } else {
            const mode = new VerificationCode({
                key: crypto.randomBytes(16).toString('hex'),
                owner: owner,
                userKey: params.userKey,
                type: params.codeType,
                code: code,
                expiryTimestamp: moment().add(15, 'minutes').unix()
            })
            await mode.save()
        }

        return { success: true, code: code, owner }
    }

    static async verifyCode(params: VerifyCodeDto) {
        if ([CodeType.PhoneRegistration, CodeType.PhoneUpdate].includes(params.codeType)) {
            params.owner = await stripPhoneNumber(params.owner)
        }
        const codeData = await VerificationCode.findOne({ owner: params.owner, type: params.codeType, code: params.code }).exec()

        if (!codeData) {
            throw new BizException(
                VerificationCodeErrors.verification_code_invalid_error,
                new ErrorContext('verification_code.service', 'verifyCode', { code: params.code })
            )
        }
        const currentTs = moment().unix()
        if (codeData.expiryTimestamp < currentTs || codeData.verified) {
            throw new BizException(
                VerificationCodeErrors.verification_code_invalid_error,
                new ErrorContext('verification_code.service', 'verifyCode', { code: params.code })
            )
        }
        const valid = codeData.code === params.code
        if (valid) {
            await VerificationCode.findByIdAndUpdate(codeData._id, { verified: true, enabled: false }).exec()
        } else {
            const sentAttempts = codeData.sentAttempts + 1
            const codeEnabled = sentAttempts > 5
            await VerificationCode.findByIdAndUpdate(codeData._id, { enabled: codeEnabled }).exec()
            throw new BizException(
                VerificationCodeErrors.verification_code_invalid_error,
                new ErrorContext('verification_code.service', 'verifyCode', { code: params.code })
            )
        }

        return { success: valid }
    }
}
