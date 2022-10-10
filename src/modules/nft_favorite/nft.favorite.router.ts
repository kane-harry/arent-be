import asyncHandler from '@utils/asyncHandler'
import { requireAuth } from '@utils/authCheck'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import NftFavoriteController from '@modules/nft_favorite/nft.favorite.controller'

export default class NftFavoriteRouter implements ICustomRouter {
    public path = ''
    public router = Router()

    constructor() {
        this.initializeRoutes()
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/nfts/:key/like`, requireAuth, asyncHandler(NftFavoriteController.likeNft))
        this.router.delete(`${this.path}/nfts/:key/like`, requireAuth, asyncHandler(NftFavoriteController.unlikeNft))
        this.router.get(`${this.path}/nfts/:key/like`, requireAuth, asyncHandler(NftFavoriteController.getMyNftLikes))

        this.router.get(`${this.path}/nfts/:key/users/liked`, asyncHandler(NftFavoriteController.getNftFavorite))
        this.router.get(`${this.path}/users/:key/nfts/fave/briefs`, requireAuth, asyncHandler(NftFavoriteController.getUserFaveNfts))
        this.router.get(`${this.path}/users/:key/nfts/fave/keys`, requireAuth, asyncHandler(NftFavoriteController.getUserFaveNftKeys))
    }
}
