import IBaseModel from '@interfaces/base.model.interface'

export enum CodeType {
    EmailRegistration = 'EmailRegistration',
    EmailUpdate = 'EmailUpdate',
    PhoneUpdate = 'PhoneUpdate',
    ForgotPassword = 'ForgotPassword',
    ForgotPin = 'ForgotPin',
    SMS = 'SMS',
    SMSLogIn = 'SMSLogIn',
    EmailLogIn = 'EmailLogIn'
}

export interface IVerificationCode extends IBaseModel {
    key: string
    owner: string
    type: CodeType
    code: string
    expiryTimestamp: number
    sentTimestamp: number
    retryAttempts: number
    sentAttempts: number
    enabled: boolean
}
