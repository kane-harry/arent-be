import IBaseModel from '../../interfaces/base.model.interface'

export enum CodeType {
    EmailRegistration = 'EmailRegistration',
    EmailUpdation = 'EmailUpdation'
}

export interface IVerificationCode extends IBaseModel {
    owner: string
    type: string
    code: string
    expiryTimestamp: number
    sentTimestamp: number
    retryAttempts: number
    sentAttempts: number
    enabled: boolean
}
