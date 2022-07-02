import IBaseModel from '@interfaces/base.model.interface'

export enum UserActions {
    ResetPassword = 'ResetPassword',
    ForgotPassword = 'ForgotPassword',
    ResetPin = 'ResetPin',
    ForgotPin = 'ForgotPin',
    Login = 'Login',
    UpdateAvatar = 'UpdateAvatar',
    UpdateUser = 'UpdateUser'
}

export interface IUserLog extends IBaseModel {
    key: string
    userKey: string
    ipAddress: string
    agent: string
    action: UserActions
    preData: string
    postData: string
}
