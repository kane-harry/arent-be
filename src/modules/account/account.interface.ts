import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'
import { Types } from 'mongoose'

export enum AccountType {
    Master = 'MASTER',
    Prime = 'PRIME',
    Ext = 'EXT'
}

export enum AccountExtType {
    Prime = 'PRIME',
    Ext = 'EXT'
}

export interface IAccount extends IBaseModel {
    key: string
    user_key: string
    name: string
    symbol: string
    type: string
    ext_type: string
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

export interface IAccountFilter extends IFilterModel {
    symbol?: string
    addresses?: string
    user_key?: string
}

export interface IMintToCoinDto {
    key: string

    amount: string

    notes?: string

    type?: string
}
