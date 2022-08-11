import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface ICollection extends IBaseModel {
    name: string
    description: string
    creator_key: string
    owner_key: string
    logo: object
    background: object
    type: string
    items_count: number
}

export interface ICollectionFilter extends IFilterModel {
    terms?: string
    owner_key?: string
    include_all?: boolean
}
