import IBaseModel from '@interfaces/base.model.interface'

export enum AuthTokenType {
    RefreshToken = 'RefreshToken'
}

export interface IAuthToken extends IBaseModel {
    key: string
    user_key: string
    type: AuthTokenType // just save refresh token => revoke refresh token => logout
    // device: string
    // ipAddress: string
    token: string
}

export enum MFAType {
    TOTP = 'TOTP',
    PIN = 'PIN',
    SMS = 'SMS',
    EMAIL = 'EMAIL'
}
