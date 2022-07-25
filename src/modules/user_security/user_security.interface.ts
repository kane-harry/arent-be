import { SecurityActions } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'

export interface IUserSecurity extends IBaseModel {
    key: string
    user_key: string
    ip_address: string
    agent: string
    action: SecurityActions
    pre_data: string
    post_data: string
}
