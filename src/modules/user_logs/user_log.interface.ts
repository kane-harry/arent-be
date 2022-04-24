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
    userId: string
    ipAddress: string
    agent: string
    action: UserActions
    oldData: string
    newData: string
}
