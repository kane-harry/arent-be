import IBaseModel from '@interfaces/base.model.interface'

export enum AuthTokenType {
    RefreshToken = 'RefreshToken'
}

export interface IAuthToken extends IBaseModel {
    userId: string
    type: AuthTokenType // just save refresh token => revoke refresh token => logout
    // device: string
    // ipAddress: string
    token: string
}