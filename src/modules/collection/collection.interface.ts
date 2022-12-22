import { CollectionType } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface ICollectionRanking extends IBaseModel {
    collection_key: string
    market_price: Number
    number_of_owners: Number
    trading_volume: Number
    trading_volume_24hrs: Number
    number_of_orders_24hrs: Number
    number_of_items: Number
    item_average_price: Number
    item_floor_price: Number
    item_celling_price: Number
    number_of_orders: Number
    order_average_price: Number
    order_floor_price: Number
    order_celling_price: Number
    updated: Date
}

export interface ICollection extends IBaseModel {
    name: string
    description: string
    category_key?: string
    creator_key: string
    owner_key: string
    logo: object
    background: object
    type: CollectionType
    attributes?: []
    items_count: number
    featured: boolean
    analytics: object
    website: string
    discord: string
    instagram: string
    twitter: string
    ranking?: ICollectionRanking
}

export interface ICollectionFilter extends IFilterModel {
    collection_key?: string
    terms?: string
    owner_key?: string
    include_all?: boolean
    featured?: boolean
    category?: string
}
