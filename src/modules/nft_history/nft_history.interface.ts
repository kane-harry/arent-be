import { NftActions } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import { IOperator } from '@interfaces/operator.interface'
import IOptions from '@interfaces/options.interface'

export interface INftHistory extends IBaseModel {
    nft_key: string
    operator: IOperator
    options: IOptions
    action: NftActions
    pre_data: Object
    post_data: Object
}
