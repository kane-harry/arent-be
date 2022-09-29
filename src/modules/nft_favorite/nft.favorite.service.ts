import { IUser } from '@modules/user/user.interface'
import { NftModel } from '@modules/nft/nft.model'
import BizException from '@exceptions/biz.exception'
import { NftErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import NftFavoriteModel from '@modules/nft_favorite/nft.favorite.model'
import { QueryRO } from '@interfaces/query.model'
import { INftFavorite, INftFavoriteFilter } from '@modules/nft_favorite/nft.favorite.interface'

export default class NftFavoriteService {
    static async likeNft(nftKey: string, userKey: string) {
        const nft = await NftModel.findOne({ key: nftKey })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.favorite.service', 'likeNft', {}))
        }
        let nftFavorite = await NftFavoriteModel.findOne({ user_key: userKey, nft_key: nftKey })
        if (nftFavorite) {
            return { success: true }
        }
        nftFavorite = new NftFavoriteModel({
            nft_key: nftKey,
            user_key: userKey,
            collection_key: nft.collection_key
        })

        await nftFavorite.save()
        await NftModel.updateOne({ key: nftKey }, { $inc: { number_of_likes: 1 } }, { upsert: true }).exec()
        return { success: true }
    }

    static async unlikeNft(nftKey: string, userKey: string) {
        const nft = await NftModel.findOne({ key: nftKey })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.favorite.service', 'unlikeNft', {}))
        }
        await NftFavoriteModel.deleteOne({ user_key: userKey, nft_key: nftKey })
        await NftModel.updateOne({ key: nftKey }, { $inc: { number_of_likes: -1 } }, { upsert: true }).exec()
        return { success: true }
    }

    static async getMyNftLikes(nftKey: string, userKey: string) {
        const nftFavorite = await NftFavoriteModel.findOne({ user_key: userKey, nft_key: nftKey, liked: true })
        return { liked: !!nftFavorite }
    }

    static async getFavorites(params: INftFavoriteFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = { $and: [] }
        const sorting: any = { _id: 1 }
        if (params.user_key) {
            filter.$and.push({ user_key: { $eq: params.user_key } })
        }
        if (params.nft_key) {
            filter.$and.push({ nft_key: { $eq: params.nft_key } })
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await NftFavoriteModel.countDocuments(filter)
        const items = await NftFavoriteModel.find<INftFavorite>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<INftFavorite>(totalCount, params.page_index, params.page_size, items)
    }
}
