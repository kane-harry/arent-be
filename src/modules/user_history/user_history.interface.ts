import { UserHistoryActions } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import { IOperator } from '@interfaces/operator.interface'
import IOptions from '@interfaces/options.interface'

export interface IUserHistory extends IBaseModel {
    key: string
    user_key: string
    operator?: IOperator
    options?: IOptions
    action: UserHistoryActions
    pre_data?: Object
    post_data?: Object
}
