import { NftHistoryActions } from '@config/constants'
import IBaseModel from '@interfaces/base.model.interface'

export interface INftHistory extends IBaseModel {
    key: string
    user_key: string
    nft_key: string
    ip_address: string
    agent: string
    country: string
    action: NftHistoryActions
    pre_data: Object
    post_data: Object
}
