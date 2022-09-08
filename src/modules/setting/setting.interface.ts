import IBaseModel from '@interfaces/base.model.interface'
import { Types } from 'mongoose'
import { BigNumber } from 'ethers'

export interface ISetting extends IBaseModel {
    nav_key: string
    registration_require_email_verified: boolean
    registration_require_phone_verified: boolean
    login_require_mfa: boolean
    withdraw_require_mfa: boolean
    prime_transfer_fee: number | Types.Decimal128 | string | BigNumber
    nft_commission_fee_rate: number | Types.Decimal128 | string | BigNumber
}
