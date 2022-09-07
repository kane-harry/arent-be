// @ts-nocheck
import { Router, Request, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
import IController from '@interfaces/controller.interface'
import NftService from './nft.service'
import {
    BulkDeleteNftDto,
    BulkUpdateNftStatusDto,
    BuyNftDto,
    CreateNftDto,
    ImportNftDto,
    UpdateNftDto,
    UpdateNftStatusDto,
    NftOnMarketDto
} from './nft.dto'
import { requireAuth } from '@utils/authCheck'
import validationMiddleware from '@middlewares/validation.middleware'
import { IUser } from '@modules/user/user.interface'
import { handleFiles } from '@middlewares/files.middleware'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { INftFilter } from '@modules/nft/nft.interface'
import { requireAdmin } from '@config/role'
import { NFT_IMAGE_SIZES } from '@config/constants'
import Multer from 'multer'
import UserModel from '@modules/user/user.model'
import TransactionService from '@modules/transaction/transaction.service'
import { config } from '@config'
import addToBuyProductQueue from '@modules/queues/nft_queue'

const upload = Multer()

class NftController implements IController {
    public path = '/nfts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}`, requireAuth, upload.any(), validationMiddleware(CreateNftDto), asyncHandler(this.createNft))
        this.router.post(`${this.path}/external/import`, requireAuth, validationMiddleware(ImportNftDto), asyncHandler(this.importNft))
        this.router.get(`${this.path}/`, asyncHandler(this.queryNFTs))
        this.router.get(`${this.path}/users/:key`, asyncHandler(this.queryMyNFTs))
        this.router.get(`${this.path}/:key`, asyncHandler(this.getNftDetail))
        this.router.put(`${this.path}/:key`, requireAuth, asyncHandler(this.updateNft))
        this.router.put(`${this.path}/:key/status`, requireAuth, requireAdmin(), asyncHandler(this.updateNftStatus))
        this.router.post(`${this.path}/status`, requireAuth, requireAdmin(), asyncHandler(this.bulkUpdateNftStatus))
        this.router.delete(`${this.path}/:key`, requireAuth, asyncHandler(this.deleteNft))
        this.router.delete(`${this.path}`, requireAuth, requireAdmin(), asyncHandler(this.bulkDeleteNft))
        this.router.put(`${this.path}/:key/market/on`, requireAuth, validationMiddleware(NftOnMarketDto), asyncHandler(this.onMarket))
        this.router.put(`${this.path}/:key/market/off`, requireAuth, asyncHandler(this.offMarket))
        this.router.post(`${this.path}/:key/buy`, requireAuth, asyncHandler(this.buyNft))
    }

    private async importNft(req: Request, res: Response) {
        const payload: ImportNftDto = req.body // should be an arrary since we support bulk import
        const operator = req.user as IUser
        const data = await NftService.importNft(payload, operator)
        return res.send(data)
    }

    private createNft = async (req: AuthenticationRequest, res: Response) => {
        const createNftDto: CreateNftDto = req.body
        createNftDto.attributes = createNftDto.attributes && createNftDto.attributes.length ? JSON.parse(createNftDto.attributes) : []
        createNftDto.meta_data = createNftDto.meta_data && createNftDto.meta_data.length ? JSON.parse(createNftDto.meta_data) : []
        const files = req.files
        const nft = await NftService.createNft(createNftDto, files, req.user, { req })
        return res.json(nft)
    }

    private async queryNFTs(req: CustomRequest, res: Response) {
        const filter = req.query as INftFilter
        const data = await NftService.queryNfts(filter)
        return res.json(data)
    }

    private async queryMyNFTs(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as INftFilter
        filter.owner_key = key
        const data = await NftService.queryNfts(filter)
        return res.json(data)
    }

    private async getNftDetail(req: CustomRequest, res: Response) {
        const { key } = req.params
        const data = await NftService.getNftDetail(key)
        return res.json(data)
    }

    private async updateNft(req: CustomRequest, res: Response) {
        const { key } = req.params
        const updateNftDto: UpdateNftDto = req.body
        updateNftDto.attributes = updateNftDto.attributes && updateNftDto.attributes.length ? JSON.parse(updateNftDto.attributes) : null
        updateNftDto.meta_data = updateNftDto.meta_data && updateNftDto.meta_data.length ? JSON.parse(updateNftDto.meta_data) : null
        const data = await NftService.updateNft(key, updateNftDto, req.user, { req })
        return res.json(data)
    }

    private async updateNftStatus(req: CustomRequest, res: Response) {
        const { key } = req.params
        const updateNftDto: UpdateNftStatusDto = req.body
        const data = await NftService.updateNftStatus(key, updateNftDto, req.user, { req })
        return res.json(data)
    }

    private async bulkUpdateNftStatus(req: CustomRequest, res: Response) {
        const updateNftDto: BulkUpdateNftStatusDto = req.body
        const { keys, status } = updateNftDto
        const data = []
        for (const key of keys) {
            try {
                const item = await NftService.updateNftStatus(key, { status: status }, req.user, { req })
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }

    private async deleteNft(req: CustomRequest, res: Response) {
        const { key } = req.params
        const nft = await NftService.deleteNft(key, req.user, { req })
        return res.json(nft)
    }

    private async bulkDeleteNft(req: CustomRequest, res: Response) {
        const deleteNftDto: BulkDeleteNftDto = req.body
        const { keys } = deleteNftDto
        const data = []
        for (const key of keys) {
            try {
                const item = await NftService.deleteNft(key, req.user, { req })
                data.push(item)
            } catch (e) {
                data.push(e)
            }
        }
        return res.json(data)
    }

    private onMarket = async (req: AuthenticationRequest, res: Response) => {
        const { key } = req.params
        const params: NftOnMarketDto = req.body
        const data = await NftService.onMarket(key, params, { req })
        return res.json(data)
    }

    private offMarket = async (req: AuthenticationRequest, res: Response) => {
        const { key } = req.params
        const data = await NftService.offMarket(key, { req })
        return res.json(data)
    }

    private buyNft = async (req: AuthenticationRequest, res: Response) => {
        const { key } = req.params
        const data = await NftService.processPurchase(key, req.user, req.agent, req.ip_address)
        return res.json(data)
    }
}

export default NftController
