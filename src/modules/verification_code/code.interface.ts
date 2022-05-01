import IBaseModel from '@interfaces/base.model.interface'

export enum CodeType {
    EmailRegistration = 'EmailRegistration',
    EmailUpdate = 'EmailUpdate',
    ForgotPassword = 'ForgotPassword',
    ForgotPin = 'ForgotPin'
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
