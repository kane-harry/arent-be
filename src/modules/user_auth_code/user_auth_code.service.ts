import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { UserAuthCodeErrors } from '@exceptions/custom.error'
import moment from 'moment'
import { stripPhoneNumber } from '@utils/phoneNumber'
import { UserAuthCodeType } from '@config/constants'
import { CreateUserAuthCodeDto, VerifyUserAuthCodeDto } from '@modules/user_auth_code/user_auth_code.dto'
import UserAuthCode from '@modules/user_auth_code/user_auth_code.model'

export default class UserAuthCodeService {
    static async storeCodeByActorAndType(owner: string, type: UserAuthCodeType) {
        const code = UserAuthCode.generate({ length: 6, charset: 'numeric' })
        const codeData = await UserAuthCode.findOne({ owner, type, enabled: false }).exec()
        const currentTs = moment().unix()

        if (codeData && codeData.sent_attempts <= 5 && codeData.sent_timestamp > currentTs - 60) {
            throw new BizException(
                UserAuthCodeErrors.verification_code_duplicate_request_in_minute_error,
                new ErrorContext('verification_code.service', 'storeCode', { owner: owner })
            )
        }
        if (codeData && codeData.sent_attempts > 5 && codeData.sent_timestamp > currentTs - 3600) {
            throw new BizException(
                UserAuthCodeErrors.verification_code_duplicate_request_in_hour_error,
                new ErrorContext('verification_code.service', 'storeCode', { owner: owner })
            )
        }

        await UserAuthCode.updateOne(
            {
                owner,
                type
            },
            {
                $set: {
                    owner,
                    type,
                    code,
                    expiry_timestamp: moment().add(15, 'minutes').unix(),
                    sent_timestamp: currentTs,
                    enabled: false
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

    static async generateCode(params: CreateUserAuthCodeDto, deliveryMethod?: (owner: any, code: string) => void) {
        params.owner = String(params.owner).trim().toLowerCase()
        switch (params.type) {
            case UserAuthCodeType.Phone:
                params.owner = stripPhoneNumber(params.owner)
        }

        const { code } = await this.storeCodeByActorAndType(params.owner, params.type)

        if (deliveryMethod) {
            deliveryMethod(params.owner, code)
        }

        return { success: true }
    }

    static async verifyCode(params: VerifyUserAuthCodeDto) {
        if ([UserAuthCodeType.Phone].includes(params.type)) {
            params.owner = stripPhoneNumber(params.owner)
        }
        params.owner = String(params.owner).trim().toLowerCase()

        const currentTs = moment().unix()

        const codeData = await UserAuthCode.findOne({
            owner: params.owner,
            type: params.type,
            code: params.code,
            expiry_timestamp: { $gte: currentTs },
            enabled: false
        }).exec()

        if (!codeData) {
            await UserAuthCode.updateOne(
                {
                    owner: params.owner,
                    type: params.type
                },
                {
                    $inc: {
                        sent_attempts: 1
                    }
                }
            ).exec()
            throw new BizException(
                UserAuthCodeErrors.verification_code_invalid_error,
                new ErrorContext('verification_code.service', 'verifyCode', { code: params.code })
            )
        }

        await UserAuthCode.findByIdAndUpdate(codeData._id, { enabled: true, sent_attempts: 0 }).exec()
        return { success: true }
    }
}
