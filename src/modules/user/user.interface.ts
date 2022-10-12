import { MFAType, UserStatus } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface IMFASettings {
    type: MFAType
    login_enabled: boolean
    withdraw_enabled: boolean
}

export interface IPasswordSettings {
    change_password_next_login: boolean
    change_password_next_login_timestamp: number
    change_password_next_login_code: string
    change_password_next_login_attempts: number
}

export interface IUserRanking extends IBaseModel {
    user_key: string
    number_of_followers: number
    number_of_followings: number
    number_of_nft_liked: number
    number_of_nft_created: number
    number_of_created_nfts_owners: number
    number_of_created_nfts_orders: number
    trading_volume_of_created_nfts: number
    number_of_created_nfts_orders_24hrs: number
    trading_volume_of_created_nfts_24hrs: number
    number_of_buying_orders: number
    trading_volume_of_buying: number
    number_of_buying_orders_24hrs: number
    trading_volume_of_buying_24hrs: number
    number_of_selling_orders: number
    trading_volume_of_selling: number
    number_of_selling_orders_24hrs: number
    trading_volume_of_selling_24hrs: number
    updated: Date
}

export interface IUser extends IBaseModel {
    first_name?: string
    last_name?: string
    chat_name: string
    email?: string
    password?: string
    pin?: string
    phone?: string
    country?: string
    source?: string
    avatar?: Object
    background?: Object
    player_id?: string
    status: UserStatus
    email_verified?: boolean
    phone_verified?: boolean
    kyc_verified?: boolean
    role: number | 0
    login_count: number | 0
    locked_timestamp: number | 0
    mfa_settings?: IMFASettings
    password_settings?: IPasswordSettings
    totp_temp_secret?: string
    totp_secret?: string
    totp_setup?: boolean
    token_version?: number
    number_of_followers: number | 0
    bio?: string
    twitter?: string
    instagram?: string
    featured?: boolean
    ranking?: IUserRanking
}

export interface IUserBrief {
    key: string
    first_name: string
    last_name: string
    chat_name: string
    avatar: object | undefined
    email?: string
}

export interface IUserQueryFilter extends IFilterModel {
    type: string
    status: string
    terms: string
    date_from: string
    date_to: string
    featured?: boolean
}
