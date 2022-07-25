import { AdminLogsActions, AdminLogsSections } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface IAdminLog extends IBaseModel {
    key: string
    operator: {
        key: string
        email: string
    }
    user_key: string
    section: AdminLogsSections
    action: AdminLogsActions
    pre_data: Object
    post_data: Object
}

export interface ILogFilter extends IFilterModel {
    terms?: string
}
