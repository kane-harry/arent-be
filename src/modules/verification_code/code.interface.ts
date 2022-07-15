import IBaseModel from '@interfaces/base.model.interface'

export enum CodeType {
    EmailRegistration = 'EmailRegistration',
    PhoneRegistration = 'PhoneRegistration',
    EmailUpdate = 'EmailUpdate',
    PhoneUpdate = 'PhoneUpdate',
    ForgotPassword = 'ForgotPassword',
    ForgotPin = 'ForgotPin',
    Login = 'Login',
    Withdraw = 'Withdraw',
    Trade = 'Trade',
    Security = 'Security'
}

export interface IVerificationCode extends IBaseModel {
    key: string
    owner: string // email|phone
    userKey: string | undefined | null
    type: CodeType
    code: string
    expiryTimestamp: number
    sentTimestamp: number
    sentAttempts: number
    verified: boolean
    enabled: boolean
}
