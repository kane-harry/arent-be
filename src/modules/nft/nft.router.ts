import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import { requireAuth } from '@utils/authCheck'
import Multer from 'multer'
import { CreateNftDto, ImportNftDto, NftOnMarketDto } from './nft.dto'
import validationMiddleware from '@middlewares/validation.middleware'
import { requireAdmin } from '@config/role'
import NftController from './nft.controller'

const upload = Multer()

export default class NftRouter implements ICustomRouter {
    public path = '/nfts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}`, requireAuth, upload.any(), validationMiddleware(CreateNftDto), asyncHandler(NftController.createNft))
        this.router.post(`${this.path}/external/import`, requireAuth, validationMiddleware(ImportNftDto), asyncHandler(NftController.importNft))
        this.router.get(`${this.path}/`, asyncHandler(NftController.queryNFTs))
        this.router.get(`${this.path}/users/:key`, asyncHandler(NftController.queryMyNFTs))
        this.router.get(`${this.path}/featured`, asyncHandler(NftController.getNftFeatured))
        this.router.get(`${this.path}/:key`, asyncHandler(NftController.getNftDetail))
        this.router.get(`${this.path}/:key/related`, asyncHandler(NftController.getRelatedNfts))
        this.router.put(`${this.path}/:key`, requireAuth, asyncHandler(NftController.updateNft))
        this.router.put(`${this.path}/:key/status`, requireAuth, requireAdmin(), asyncHandler(NftController.updateNftStatus))
        this.router.post(`${this.path}/status`, requireAuth, requireAdmin(), asyncHandler(NftController.bulkUpdateNftStatus))
        this.router.delete(`${this.path}/:key`, requireAuth, asyncHandler(NftController.deleteNft))
        this.router.delete(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(NftController.bulkDeleteNft))
        this.router.put(`${this.path}/:key/market/on`, requireAuth, validationMiddleware(NftOnMarketDto), asyncHandler(NftController.onMarket))
        this.router.put(`${this.path}/:key/market/off`, requireAuth, asyncHandler(NftController.offMarket))
        this.router.post(`${this.path}/:key/buy`, requireAuth, asyncHandler(NftController.buyNft))
        this.router.post(`${this.path}/:key/bids`, requireAuth, asyncHandler(NftController.bidNft))
        this.router.get(`${this.path}/:key/bids`, asyncHandler(NftController.getNftBids))
        this.router.post(`${this.path}/:key/offers`, requireAuth, asyncHandler(NftController.makeOffer))
        this.router.get(`${this.path}/:key/offers`, asyncHandler(NftController.getOffers))
        this.router.post(`${this.path}/offers/:key/accept`, requireAuth, asyncHandler(NftController.acceptOffer))
        this.router.post(`${this.path}/offers/:key/reject`, requireAuth, asyncHandler(NftController.rejectOffer))
        this.router.post(`${this.path}/offers/:key/cancel`, requireAuth, asyncHandler(NftController.cancelOffer))
        this.router.put(`${this.path}/:key/featured`, requireAuth, requireAdmin(), asyncHandler(NftController.updateNftFeatured))
        this.router.put(`${this.path}/featured`, requireAuth, requireAdmin(), asyncHandler(NftController.bulkUpdateNftFeatured))
    }
}
