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
    user_key: string | undefined | null
    type: CodeType
    code: string
    expiry_timestamp: number
    sent_timestamp: number
    sent_attempts: number
    verified: boolean
    enabled: boolean
}
