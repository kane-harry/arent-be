import { CollectionType } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface ICollectionRanking {
    market_price: Number
    number_of_owners: Number
    trading_volume: Number
    number_of_orders: Number
    trading_volume_24hrs: Number
    number_of_orders_24hrs: Number
    number_of_items: Number
    floor_price: Number
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
    terms?: string
    owner_key?: string
    include_all?: boolean
    featured?: boolean
    category?: string
}
