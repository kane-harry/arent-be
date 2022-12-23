import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'
import { Types } from 'mongoose'

export interface ITransaction extends IBaseModel {
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
    chain?: string
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
    fee_address: string
    fee: string
    mode?: string
    details?: object // addtional info
}

export interface IEstimateFee {
    symbol?: string
    network?: string
}
