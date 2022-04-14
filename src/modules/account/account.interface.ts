import IBaseModel from '../../interfaces/base.model.interface'
import IFilterModel from '../../interfaces/filter.model.interface'
import { Types } from 'mongoose'

export enum AccountType {
    Prime = 'PRIME',
    Ext = 'EXT'
}

export interface IAccount extends IBaseModel {
    userId: string
    name: string
    symbol: string
    type: string
    address: string
    platform: string
    amount: Types.Decimal128
    amountLocked: Types.Decimal128
    salt: string
    keyStore: object
    metaData: object
    syncTimestamp?: number
    deposited: Types.Decimal128
    withdrawed: Types.Decimal128
    committed: Types.Decimal128
}

export interface IAccountFilter extends IFilterModel {
    symbol?: string
    addresses?: string
    userid?: string
}
