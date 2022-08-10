import IBaseModel from '@interfaces/base.model.interface'
import { Types } from 'mongoose'
import IFilterModel from '@interfaces/filter.model.interface'

export interface INft extends IBaseModel {
    name: string
    title: string
    description: string
    tags: string
    price: number | Types.Decimal128
    currency: string
    meta_data: [] | undefined
    videos: object | [] | undefined
    images: object | [] | undefined
    type: string
    amount: number
    attributes: [] | undefined
    on_market: boolean
    creator: string
    owner: string
    nft_token_id: string
    status: string
    collection_key: string
}

export interface INftImportLog extends IBaseModel {
    user_key: string
    contract_address: string
    token_id: string
    type: string
    platform: string
    status: string
}

export interface INftFilter extends IFilterModel {
    terms?: string
    owner?: string
    price_min?: number
    price_max?: number
    collection_key?: string
    on_market?: boolean
}
