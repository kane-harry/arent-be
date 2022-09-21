import { NftActions } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'
import IOptions from '@interfaces/options.interface'
import { IOperator } from '@modules/user/user.interface'

export interface INftHistory extends IBaseModel {
    nft_key: string
    operator: IOperator
    options: IOptions
    action: NftActions
    pre_data: Object
    post_data: Object
}
