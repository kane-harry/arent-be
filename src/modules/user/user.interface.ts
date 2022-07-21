import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export enum UserStatus {
    Normal = 'Normal',
    Locked = 'Locked',
    Suspend = 'Suspend'
}

export interface IUser extends IBaseModel {
    key: string
    first_name: string
    last_name: string
    chat_name: string
    email: string
    password: string
    pin: string
    phone: string
    country: string
    avatar: Object | null
    player_id?: string
    status: UserStatus
    email_verified: boolean
    phone_verified: boolean
    kyc_verified: boolean
    role: number | 0
    login_count: number | 0
    locked_timestamp: number | 0
    mfa_settings: Object | any
    change_password_next_login: boolean
    change_password_next_login_timestamp: number
    change_password_next_login_code: string
    change_password_next_login_attempts: number
    totp_temp_secret: string
    totp_secret: string
    totp_setup: boolean
    token_version: number
}

export interface IUserQueryFilter extends IFilterModel {
    type: string
    status: string
    terms: string
    date_from: string
    date_to: string
}
