import { AdminLogsActions, AdminLogsSections } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'
import { IOperator } from '@interfaces/operator.interface'
import IOptions from '@interfaces/options.interface'

export interface IAdminLog extends IBaseModel {
    key: string
    user_key: string
    operator: IOperator
    options?: IOptions
    section: AdminLogsSections
    action: AdminLogsActions
    pre_data: Object
    post_data: Object
}

export interface ILogFilter extends IFilterModel {
    terms?: string
}
