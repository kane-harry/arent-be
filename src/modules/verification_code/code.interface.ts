import { CODE_TYPE } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'

export interface IVerificationCode extends IBaseModel {
    key: string
    owner: string // email|phone
    user_key: string | undefined | null
    type: CODE_TYPE
    code: string
    expiry_timestamp: number
    sent_timestamp: number
    sent_attempts: number
    verified: boolean
    enabled: boolean
}
