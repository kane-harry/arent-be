// @ts-nocheck
import { Router, Request, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
import IController from '@interfaces/controller.interface'
import NftService from './nft.service'
import { CreateNftDto, ImportNftDto, UpdateNftDto } from './nft.dto'
import { requireAuth } from '@utils/authCheck'
import validationMiddleware from '@middlewares/validation.middleware'
import { IUser } from '@modules/user/user.interface'
import { handleFiles, resizeImages, uploadFiles } from '@middlewares/files.middleware'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { INftFilter } from '@modules/nft/nft.interface'
import { NftModel } from '@modules/nft/nft.model'

class NftController implements IController {
    public path = '/nfts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(
            `${this.path}`,
            requireAuth,
            asyncHandler(
                handleFiles([
                    { name: 'nft', maxCount: 1 },
                    { name: 'images', maxCount: 1 }
                ])
            ),
            asyncHandler(
                resizeImages({
                    nft: [{ maxSize: 300, id: 'thumb' }],
                    images: [
                        { maxSize: 1280, id: 'lg' },
                        { maxSize: 600, id: 'md' },
                        { maxSize: 300, id: 'sm' }
                    ]
                })
            ),
            asyncHandler(uploadFiles('nft')),
            asyncHandler(uploadFiles('images')),
            asyncHandler(this.createNft)
        )
        this.router.post(`${this.path}/external/import`, requireAuth, validationMiddleware(ImportNftDto), asyncHandler(this.importNft))
        this.router.get(`${this.path}/`, asyncHandler(this.queryNFTs))
        this.router.get(`${this.path}/users/:key`, asyncHandler(this.queryMyNFTs))
        this.router.get(`${this.path}/:key`, asyncHandler(this.getNftDetail))
        this.router.put(`${this.path}/:key`, requireAuth, asyncHandler(this.updateNft))
        this.router.delete(`${this.path}/:key`, requireAuth, asyncHandler(this.deleteNft))
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
        createNftDto.metadata = createNftDto.metadata && createNftDto.metadata.length ? JSON.parse(createNftDto.metadata) : []
        if (res?.locals?.files_uploaded?.length) {
            createNftDto.image = { normal: '', thumb: '' }
            const original = res.locals.files_uploaded.find((item: any) => item.type === 'original' && item.fieldname === 'nft')
            createNftDto.image.normal = original?.key
            const thumb = res.locals.files_uploaded.find((item: any) => item.type === 'thumb' && item.fieldname === 'nft')
            createNftDto.image.thumb = thumb?.key

            const images = res.locals.files_uploaded.filter((item: any) => item.fieldname === 'images')
            const tempImages = {}
            images.forEach((image: any) => {
                const name = image.name
                const type = image.type
                tempImages[name] = tempImages[name] ?? {}
                tempImages[name].name = name
                tempImages[name][type] = image.key
            })
            createNftDto.images = Object.values(tempImages)
        }
        const nft = await NftService.createNft(createNftDto, req.user)
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
        filter.owner = key
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
        updateNftDto.metadata = updateNftDto.metadata && updateNftDto.metadata.length ? JSON.parse(updateNftDto.metadata) : null
        const data = await NftService.updateNft(key, updateNftDto, req.user)
        return res.json(data)
    }

    private async deleteNft(req: CustomRequest, res: Response) {
        const { key } = req.params
        const nft = await NftService.deleteNft(key, req.user)
        return res.json(nft)
    }
}

export default NftController
