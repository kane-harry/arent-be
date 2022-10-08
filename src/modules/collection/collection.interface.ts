import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface ICollection extends IBaseModel {
    name: string
    description: string
    category_key?: string
    creator_key: string
    owner_key: string
    logo: object
    background: object
    type: string
    items_count: number
    featured: boolean
    analytics: object
    website: string
    discord: string
    instagram: string
    twitter: string
}

export interface ICollectionFilter extends IFilterModel {
    terms?: string
    owner_key?: string
    include_all?: boolean
    featured?: boolean
    category?: string
}
