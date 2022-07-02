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
    userKey: string
    name: string
    symbol: string
    type: string
    extType: string
    address: string
    platform: string
    amount: number | Types.Decimal128
    amountLocked: number | Types.Decimal128
    salt: string
    keyStore: object
    metaData: object
    extKey: string
    syncTimestamp?: number
    deposited: number | Types.Decimal128
    withdrawed: number | Types.Decimal128
    committed: number | Types.Decimal128
    nonce?: number
}

export interface IAccountFilter extends IFilterModel {
    symbol?: string
    addresses?: string
    userKey?: string
}

export interface IMintToCoinDto {
    key: string

    amount: string

    notes?: string

    type?: string
}
