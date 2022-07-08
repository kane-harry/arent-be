import IBaseModel from '@interfaces/base.model.interface'

export enum SecurityActions {
    ResetPassword = 'ResetPassword',
    ForgotPassword = 'ForgotPassword',
    ResetPin = 'ResetPin',
    ForgotPin = 'ForgotPin',
    Login = 'Login',
    UpdateAvatar = 'UpdateAvatar',
    UpdateUser = 'UpdateUser'
}

export interface IUserSecurity extends IBaseModel {
    key: string
    userKey: string
    ipAddress: string
    agent: string
    action: SecurityActions
    preData: string
    postData: string
}
