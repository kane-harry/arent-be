import IBaseModel from '@interfaces/base.model.interface'
import { Types } from 'mongoose'
import IFilterModel from '@interfaces/filter.model.interface'

export interface INft extends IBaseModel {
    name: string
    description: string
    external_link: string
    collection_key: string
    // collection
    price: number | Types.Decimal128
    currency: string
    meta_data: [] | undefined
    animation: object | undefined
    image: object | undefined
    type: string
    num_sales: number
    creator_key: string
    owner_key: string
    attributes: [] | undefined
    on_market: boolean
    listing_date: Date | undefined
    last_sale: Date | undefined
    token_id: string
    status: string
    is_presale: boolean
    top_bid: object | undefined
    // auctions
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
