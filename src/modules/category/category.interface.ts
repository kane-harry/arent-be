import IBaseModel from '@interfaces/base.model.interface'

export interface ICategory extends IBaseModel {
    nav_key: string
    name: string
    description: string
}
