import IBaseModel from '@interfaces/base.model.interface'

export enum SecurityActions {
    Login = 'Login'
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
