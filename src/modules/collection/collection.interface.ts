import IBaseModel from '@interfaces/base.model.interface'

export interface ICollection extends IBaseModel {
    name: string
    description: string
    creator: string
    owner: string
    logo: string
    background: string
    type: string
    items_count: number
}
