import IBaseModel from '../../interfaces/base.model.interface'
import IFilterModel from '../../interfaces/filter.model.interface'

export interface IAccount extends IBaseModel {
    _id: string
    symbol: string
    address: string
    publicKey: string
    amount: number
    nonce: number
    type: string
    raw: boolean
}

export interface IAccountFilter extends IFilterModel {
    symbol?: string
    addresses?: string // query user's account list -  abc,abe,efg
}
