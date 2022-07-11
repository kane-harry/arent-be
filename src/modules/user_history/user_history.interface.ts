import IBaseModel from '@interfaces/base.model.interface'

export enum UserHistoryActions {
    UpdateProfile = 'UpdateProfile',
    Register = 'Register',
    UpdateEmail = 'UpdateEmail',
    UpdatePhone = 'UpdatePhone',
    ResetPassword = 'ResetPassword',
    ResetPin = 'ResetPin',
    UpdateSecurity = 'UpdateSecurity'
}

export interface IUserHistory extends IBaseModel {
    key: string
    userKey: string
    ipAddress: string
    agent: string
    country: string
    action: UserHistoryActions
    preData: Object
    postData: Object
}
