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
    price_type: string
    auction_start: number
    auction_end: number
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
    top_bid: ITopBid | undefined
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
    nft_key: string | undefined
    collection_key: string | undefined
    price: number | Types.Decimal128
    currency: string
    token_id: string
    previous_owner: object | undefined
    current_owner: object | undefined
    type: string
}

export interface INftSaleLog extends IBaseModel {
    nft_key: string | undefined
    collection_key: string | undefined
    unit_price: number | Types.Decimal128
    currency: string
    order_value: number | Types.Decimal128
    commission_fee: number | Types.Decimal128
    royalty_fee: number | Types.Decimal128
    quantity: number
    seller: object | undefined
    buyer: object | undefined
    secondary_market: Boolean
    details: object | undefined
}

export interface INftBidLog extends IBaseModel {
    nft_key: string | undefined
    collection_key: string | undefined
    price: number | Types.Decimal128
    currency: string | undefined
    user: Object | null
    secondary_market: boolean | undefined
}

export interface INftFilter extends IFilterModel {
    terms?: string
    owner_key?: string
    price_min?: number
    price_max?: number
    collection_key?: string
    on_market?: boolean
}

export interface ITopBid {
    user_key: string
    avatar: Object | null
    chat_name: string
    price: string
    secondary_market: boolean
    currency: string
    address: string
    account_key: string
}

export interface INftOfferLog extends IBaseModel {
    action: string
    nft_key: string | undefined
    collection_key: string | undefined
    price: number | Types.Decimal128
    currency: string | undefined
    user: Object | null
    secondary_market: boolean | undefined
}

export interface INftOffer extends IBaseModel {
    status: string
    user_key: string
    nft_key: string | undefined
    collection_key: string | undefined
    price: number | Types.Decimal128
    currency: string
    user: Object | null
    secondary_market: boolean | undefined
}
