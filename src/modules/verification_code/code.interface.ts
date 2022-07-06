import IBaseModel from '@interfaces/base.model.interface'

export enum CodeType {
    EmailRegistration = 'EmailRegistration',
    PhoneRegistration = 'PhoneRegistration',
    EmailUpdate = 'EmailUpdate',
    PhoneUpdate = 'PhoneUpdate',
    VerifyEmail = 'VerifyEmail',
    VerifyPhone = 'VerifyPhone',
    ForgotPassword = 'ForgotPassword',
    SMSForgotPassword = 'SMSForgotPassword',
    ForgotPin = 'ForgotPin',
    SMS = 'SMS',
    SMSLogin = 'SMSLogin',
    EmailLogIn = 'EmailLogin',
    Withdraw = 'Withdraw'
}

export interface IVerificationCode extends IBaseModel {
    key: string
    owner: string // email|phone|userkey
    type: CodeType
    code: string
    expiryTimestamp: number
    sentTimestamp: number
    sentAttempts: number
    verified: boolean
    enabled: boolean
}
