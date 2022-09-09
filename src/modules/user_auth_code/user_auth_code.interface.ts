import { CodeType } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'

export interface IUserAuthCode extends IBaseModel {
    key: string
    owner: string // email|phone
    type: CodeType
    code: string
    sent_timestamp: number
    expiry_timestamp: number
    enabled: boolean
    sent_attempts: number
}
