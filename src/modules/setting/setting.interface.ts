import IBaseModel from '@interfaces/base.model.interface'
import { Types } from 'mongoose'
import { BigNumber } from 'ethers'

export interface ISetting extends IBaseModel {
    registrationRequireEmailVerified: boolean
    registrationRequirePhoneVerified: boolean
    loginRequireMFA: boolean
    withdrawRequireMFA: boolean
    primeTransferFee: number | Types.Decimal128 | string | BigNumber
}

export const defaultSetting = {
    registrationRequireEmailVerified: true,
    registrationRequirePhoneVerified: false,
    loginRequireMFA: true,
    withdrawRequireMFA: true,
    primeTransferFee: 0.1
}
