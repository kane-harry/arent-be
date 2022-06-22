import IBaseModel from '@interfaces/base.model.interface'
import { Types } from 'mongoose'
import { BigNumber } from 'ethers'

export interface ISetting extends IBaseModel {
    registrationRequireEmailVerified: boolean
    registrationRequirePhoneVerified: boolean
    loginRequireMFA: boolean,
    withdrawRequireMFA: boolean,
    primeTransferFee: number | Types.Decimal128 | string | BigNumber
    stripDepositFeeRate: number
    stripDepositFeePerTransaction: number
    stripeApiKey: string,
    depositStripeDisabled: boolean
    depositRequiredKycValidation: boolean
}

export const defaultSetting = {
    registrationRequireEmailVerified: true,
    registrationRequirePhoneVerified: false,
    loginRequireMFA: true,
    withdrawRequireMFA: true,
    primeTransferFee: 0.1,
    stripDepositFeeRate: 0.034,
    stripDepositFeePerTransaction: 0.5,
    stripeApiKey: 'sk_test_51FSG3gBRT79aVurC6qReRnCjux5824bwzI1bRZCqxVnpujab21zIBVnX9xzR7IJ1VGzidfbL7NfafHUZ7oW91f7v00nDEdf4s8',
    depositStripeDisabled: false,
    depositRequiredKycValidation: false
}
