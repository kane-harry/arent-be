import { AuthTokenType } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'

export interface IAuthToken extends IBaseModel {
    key: string
    user_key: string
    type: AuthTokenType // just save refresh token => revoke refresh token => logout
    // device: string
    // ipAddress: string
    token: string
}
