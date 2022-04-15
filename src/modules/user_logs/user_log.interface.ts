import IBaseModel from '../../interfaces/base.model.interface'

export enum UserActions {
    ResetPassword = 'ResetPassword',
    ForgotPassword = 'ForgotPassword',
    ResetPin = 'ResetPin',
    ForgotPin = 'ForgotPin',
    Login = 'Login'
}

export interface IUserLog extends IBaseModel {
    ip_address: string
    agent: string
    action: UserActions
    old_data: string
    new_data: string
}
