import { Response } from 'express'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { INftFavoriteFilter } from '@modules/nft_favorite/nft.favorite.interface'
import NftFavoriteService from '@modules/nft_favorite/nft.favorite.service'
import { NftFavoriteRO, UserFavoriteRO } from '@modules/nft_favorite/nft.favorite.ro'
import UserModel from '@modules/user/user.model'
import { NftModel } from '@modules/nft/nft.model'
import { CollectionModel } from '@modules/collection/collection.model'
import NftService from '@modules/nft/nft.service'
import CollectionService from '@modules/collection/collection.service'
import UserService from '@modules/user/user.service'

export default class NftFavoriteController {
    static async likeNft(req: AuthenticationRequest, res: Response) {
        const userKey = req.user.key
        const { key } = req.params
        const data = await NftFavoriteService.likeNft(key, userKey)
        return res.json(data)
    }

    static async unlikeNft(req: AuthenticationRequest, res: Response) {
        const userKey = req.user.key
        const { key } = req.params
        const data = await NftFavoriteService.unlikeNft(key, userKey)
        return res.json(data)
    }

    static async getMyNftLikes(req: AuthenticationRequest, res: Response) {
        const userKey = req.user.key
        const { key } = req.params
        const data = await NftFavoriteService.getMyNftLikes(key, userKey)
        return res.json(data)
    }

    static async getNftFavorite(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as INftFavoriteFilter
        filter.nft_key = key
        const data = await NftFavoriteService.getFavorites(filter)
        const userKeys = data.items.map(item => item.user_key)
        const users = await UserService.getBriefByKeys(userKeys)
        return res.json(new NftFavoriteRO(data, users))
    }

    static async getUserFaveNfts(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as INftFavoriteFilter
        filter.user_key = key
        const data = await NftFavoriteService.getFavorites(filter)
        const nftKeys = data.items.map(item => item.nft_key)
        const nfts = await NftService.getNftBriefByKeys(nftKeys)

        const collectionKeys = data.items.map(item => item.collection_key)
        const collections = await CollectionService.getCollectionBriefByKeys(collectionKeys)
        const result = new UserFavoriteRO(data, nfts, collections)
        return res.json(result)
    }

    static async getUserFaveNftKeys(req: CustomRequest, res: Response) {
        const { key } = req.params
        const data = await NftFavoriteService.getUserFaveNftKeys(key)
        return res.json(data)
    }
}