import IBaseModel from '@interfaces/base.model.interface'

export enum CodeType {
    EmailRegistration = 'EmailRegistration',
    PhoneRegistration = 'PhoneRegistration',
    EmailUpdate = 'EmailUpdate',
    PhoneUpdate = 'PhoneUpdate',
    EmailForgotPassword = 'EmailForgotPassword',
    SMSForgotPassword = 'SMSForgotPassword',
    EmailForgotPin = 'EmailForgotPin',
    SMSForgotPin = 'SMSForgotPin',
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
