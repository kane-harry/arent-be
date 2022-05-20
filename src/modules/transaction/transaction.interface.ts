import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'
import { Types } from 'mongoose'

export enum FeeMode {
    Inclusive = 'inclusive',
    Exclusive = 'exclusive'
}

export interface ITransaction extends IBaseModel {
    key?: string
    owner: string
    symbol: string
    sender: string
    recipient: string
    amount: number | Types.Decimal128
    type: string
    status: string
    hash?: string
    block?: number
    signature?: string
    notes?: string
    details?: object
}

export interface ITransactionFilter extends IFilterModel {
    symbol?: string
    keys?: string
    owner?: string
    address?: string
}

export interface ISendCoinDto {
    symbol: string
    sender: string
    recipient: string
    amount: string
    nonce: string
    signature: string
    type: string
    notes: string
    feeAddress: string
    mode?: string
    details?: object // addtional info
}
