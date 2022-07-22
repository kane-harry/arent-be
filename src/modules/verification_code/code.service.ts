import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { AuthErrors, VerificationCodeErrors } from '@exceptions/custom.error'
import moment from 'moment'
import { CreateCodeDto, VerifyCodeDto } from './code.dto'
import { VerificationCode } from './code.model'
import UserModel from '@modules/user/user.model'
import { stripPhoneNumber } from '@utils/phoneNumber'
import { CodeType } from '@config/constants'

export default class VerificationCodeService {
    static async storeCodeByActorAndType(owner: string, userKey: string | undefined, type: CodeType) {
        const code = VerificationCode.generate({ length: 6, charset: 'numeric' }, owner)
        const codeData = await VerificationCode.findOne({ owner, type }).exec()
        const currentTs = moment().unix()

        if (codeData && codeData.sent_attempts <= 5 && codeData.sent_timestamp > currentTs - 60) {
            throw new BizException(
                VerificationCodeErrors.verification_code_duplicate_request_in_minute_error,
                new ErrorContext('verification_code.service', 'storeCode', { owner: owner })
            )
        }
        if (codeData && codeData.sent_attempts > 5 && codeData.sent_timestamp > currentTs - 3600) {
            throw new BizException(
                VerificationCodeErrors.verification_code_duplicate_request_in_hour_error,
                new ErrorContext('verification_code.service', 'storeCode', { owner: owner })
            )
        }

        await VerificationCode.updateOne(
            {
                owner,
                type
            },
            {
                $set: {
                    owner,
                    user_key: userKey,
                    type,
                    code,
                    expiry_timestamp: moment().add(15, 'minutes').unix(),
                    sent_timestamp: currentTs,
                    verified: false
                },
                $inc: {
                    sent_attempts: 1
                }
            },
            {
                upsert: true
            }
        ).exec()

        return { code }
    }

    static async generateCode(params: CreateCodeDto, deliveryMethod?: (owner: any, code: string) => void) {
        params.owner = String(params.owner).trim().toLowerCase()
        switch (params.code_type) {
            case CodeType.PhoneRegistration:
            case CodeType.PhoneUpdate:
                params.owner = stripPhoneNumber(params.owner)

            // eslint-disable-next-line no-fallthrough
            case CodeType.EmailRegistration:
            case CodeType.EmailUpdate:
                // check duplicate user for registration and update email/phone
                const filter = {
                    $or: [{ email: params.owner }, { phone: params.owner }]
                }
                const user = await UserModel.findOne(filter).select('key email phone').exec()
                if (!user) {
                    break
                }
                throw new BizException(
                    [CodeType.EmailRegistration, CodeType.EmailUpdate].includes(params.code_type)
                        ? AuthErrors.registration_email_exists_error
                        : AuthErrors.registration_phone_exists_error,
                    new ErrorContext('auth.service', 'generateCode', { owner: params.owner })
                )
        }

        const { code } = await this.storeCodeByActorAndType(params.owner, params.user_key, params.code_type)

        if (deliveryMethod) {
            deliveryMethod(params.owner, code)
        }

        return { success: true }
    }

    static async verifyCode(params: VerifyCodeDto) {
        if ([CodeType.PhoneRegistration, CodeType.PhoneUpdate].includes(params.code_type)) {
            params.owner = stripPhoneNumber(params.owner)
        }
        params.owner = String(params.owner).trim().toLowerCase()

        const currentTs = moment().unix()

        const codeData = await VerificationCode.findOne({
            owner: params.owner,
            type: params.code_type,
            code: params.code,
            expiry_timestamp: { $gte: currentTs },
            verified: false
        }).exec()

        if (!codeData) {
            await VerificationCode.updateOne(
                {
                    owner: params.owner,
                    type: params.code_type
                },
                {
                    $set: {
                        verified: false
                    },
                    $inc: {
                        sent_attempts: 1
                    }
                }
            ).exec()
            throw new BizException(
                VerificationCodeErrors.verification_code_invalid_error,
                new ErrorContext('verification_code.service', 'verifyCode', { code: params.code })
            )
        }

        await VerificationCode.findByIdAndUpdate(codeData._id, { verified: true, sent_attempts: 0 }).exec()
        return { success: true }
    }
}
