import IBaseModel from '../../interfaces/base.model.interface'

export enum CodeType {
    EmailRegistration = 'EmailRegistration',
    EmailUpdating = 'EmailUpdating'
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
