import IBaseModel from '@interfaces/base.model.interface'
import { Types } from 'mongoose'
import { BigNumber } from 'ethers'

export interface ISetting extends IBaseModel {
    registration_require_email_verified: boolean
    registration_require_phone_verified: boolean
    login_require_mfa: boolean
    withdraw_require_mfa: boolean
    prime_transfer_fee: number | Types.Decimal128 | string | BigNumber
}

export const defaultSetting = {
    registration_require_email_verified: true,
    registration_require_phone_verified: false,
    login_require_mfa: true,
    withdraw_require_mfa: true,
    prime_transfer_fee: 0.1
}
