import IBaseModel from '@interfaces/base.model.interface'
import { Types } from 'mongoose'

export interface INft extends IBaseModel {
    name: string
    title: string
    description: string
    tags: string
    price: number | Types.Decimal128
    platform: string
    source: string
    image: object // {}
    images: object | [] | undefined
    attributes: [] | undefined
    creator: string
    owner: string
    status: string
}

export interface INftImportLog extends IBaseModel {
    user_key: string
    contract_address: string
    token_id: string
    type: string
    platform: string
    status: string
}
