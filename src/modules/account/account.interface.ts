import { AccountExtType, AccountType } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'
import { Types } from 'mongoose'

export interface IAccount extends IBaseModel {
    key: string
    user_key: string
    name: string
    symbol: string
    type: AccountType
    ext_type: AccountExtType
    address: string
    platform: string
    amount: number | Types.Decimal128
    amount_locked: number | Types.Decimal128
    salt: string
    key_store: object
    meta_data: object
    ext_key: string
    sync_timestamp?: number
    deposited: number | Types.Decimal128
    withdrew: number | Types.Decimal128
    committed: number | Types.Decimal128
    nonce?: number
}

export interface IAccountRO extends IAccount {
    amount_usd: number | Types.Decimal128
    amount_locked_usd: number | Types.Decimal128
}

export interface IUserAccountsFilter extends IFilterModel {
    key?: string
    keys?: string
    symbols?: string
    addresses?: string
}

export interface IAdminAccountsFilter extends IFilterModel {
    key?: string
    symbol?: string
    user_key?: string
    keys?: string
    symbols?: string
    addresses?: string
    removed?: string
    type?: AccountType
}

export interface IMintToCoinDto {
    key: string

    amount: string

    notes?: string

    type?: string
}
