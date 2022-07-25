import { UserHistoryActions } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'

export interface IUserHistory extends IBaseModel {
    key: string
    user_key: string
    ip_address: string
    agent: string
    country: string
    action: UserHistoryActions
    pre_data: Object
    post_data: Object
}
