import { CodeType } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'

export interface IVerificationCode extends IBaseModel {
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
