import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export enum AdminLogsActions {
    UpdateUser = 'UpdateUser',
    LockUser = 'LockUser',
    UnlockUser = 'UnlockUser',
    RemoveUser = 'RemoveUser',
    ResetTOPTUser = 'ResetTOPTUser',
    UpdateRoleUser = 'UpdateRoleUser',
    MintMasterAccount = 'MintMasterAccount',
    ResetCredentialsUser = 'ResetCredentialsUser'
}

export enum AdminLogsSections {
    User = 'User',
    Transaction = 'Transaction',
    Account = 'Account'
}

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
