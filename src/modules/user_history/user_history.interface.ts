import IBaseModel from '@interfaces/base.model.interface'

export enum UserHistoryActions {
    UpdateProfile = 'UpdateProfile',
    Register = 'Register',
    UpdateEmail = 'UpdateEmail',
    UpdatePhone = 'UpdatePhone',
    ResetPassword = 'ResetPassword',
    ResetPin = 'ResetPin',
    UpdateSecurity = 'UpdateSecurity',
    SetupCredentials = 'SetupCredentials',
    SetupTOTP = 'SetupTOTP'
}

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
