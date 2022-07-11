import IBaseModel from '@interfaces/base.model.interface'

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
    userKey: string
    section: AdminLogsSections
    action: AdminLogsActions
    preData: Object
    postData: Object
}
