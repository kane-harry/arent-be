import IBaseModel from '@interfaces/base.model.interface'
import IFilterModel from '@interfaces/filter.model.interface'

export interface INftFavorite extends IBaseModel {
    user_key: String
    nft_key: String
    collection_key: String
}

export interface INftFavoriteFilter extends IFilterModel {
    user_key?: String
    nft_key?: String
    collection_key?: String
}
