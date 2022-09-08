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
    royalty: number | Types.Decimal128
    currency: string
    meta_data: [] | undefined
    animation: object | undefined
    image: object | undefined
    type: string
    num_sales: number
    quantity: number
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

export interface INftOwnershipLog extends IBaseModel {
    nft_key: string
    price: string
    token_id: string
    previous_owner: string
    current_owner: string
}

export interface INftFilter extends IFilterModel {
    terms?: string
    owner_key?: string
    price_min?: number
    price_max?: number
    collection_key?: string
    on_market?: boolean
}

export interface INftSaleLog extends IBaseModel {
    nft_key: string
    price: string
    commission_fee: string
    seller_amount: string
    buyer_rebate_fee: string
    seller_rebate_fee: string
    royalty_fee: string
    rate: string
    usd_value: string
    quantity: string
    unit_price: string
}
