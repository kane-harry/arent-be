import { Router, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
import IController from '@interfaces/controller.interface'
import CollectionService from './collection.service'
import { AssignCollectionDto, CreateCollectionDto, UpdateCollectionDto } from './collection.dto'
import { requireAuth } from '@utils/authCheck'
import { handleFiles } from '@middlewares/files.middleware'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { ICollectionFilter } from '@modules/collection/collection.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { NFT_IMAGE_SIZES } from '@config/constants'

class CollectionController implements IController {
    public path = '/collections'
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
                    { name: 'logo', maxCount: 1, resizeOptions: NFT_IMAGE_SIZES },
                    { name: 'background', maxCount: 1 }
                ])
            ),
            validationMiddleware(CreateCollectionDto),
            asyncHandler(this.createCollection)
        )
        this.router.get(`${this.path}/`, asyncHandler(this.queryCollections))
        this.router.get(`${this.path}/:key`, asyncHandler(this.getCollectionDetail))
        this.router.delete(`${this.path}/:key`, requireAuth, asyncHandler(this.deleteCollection))
        this.router.put(
            `${this.path}/:key`,
            requireAuth,
            asyncHandler(
                handleFiles([
                    { name: 'logo', maxCount: 1, resizeOptions: NFT_IMAGE_SIZES },
                    { name: 'background', maxCount: 1 }
                ])
            ),
            asyncHandler(this.updateCollection)
        )
        this.router.get(`${this.path}/user/:key`, asyncHandler(this.queryUserCollections))
        this.router.put(`${this.path}/:key/assign`, requireAuth, asyncHandler(this.assignCollection))
    }

    private createCollection = async (req: AuthenticationRequest, res: Response) => {
        const createCollectionDto: CreateCollectionDto = req.body
        const collection = await CollectionService.createCollection(createCollectionDto, req.user)
        return res.send(collection)
    }

    private async queryCollections(req: CustomRequest, res: Response) {
        const filter = req.query as ICollectionFilter
        const data = await CollectionService.queryCollections(filter)
        return res.json(data)
    }

    private getCollectionDetail = async (req: AuthenticationRequest, res: Response) => {
        const key = req.params.key
        const data = await CollectionService.getCollectionDetail(key)
        return res.json(data)
    }

    private updateCollection = async (req: AuthenticationRequest, res: Response) => {
        const key = req.params.key
        const updateCollectionDto: UpdateCollectionDto = req.body
        if (res?.locals?.files_uploaded?.length) {
            const logo = res.locals.files_uploaded.find((item: any) => item.type === 'original' && item.fieldname === 'logo')
            updateCollectionDto.logo = logo?.key
            const background = res.locals.files_uploaded.find((item: any) => item.type === 'original' && item.fieldname === 'background')
            updateCollectionDto.background = background?.key
        }
        const collection = await CollectionService.updateCollection(key, updateCollectionDto, req.user)
        return res.json(collection)
    }

    private deleteCollection = async (req: AuthenticationRequest, res: Response) => {
        const key = req.params.key
        const collection = await CollectionService.deleteCollection(key, req.user)
        return res.json(collection)
    }

    private async queryUserCollections(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as ICollectionFilter
        filter.owner = key
        const data = await CollectionService.queryCollections(filter)
        return res.json(data)
    }

    private async assignCollection(req: AuthenticationRequest, res: Response) {
        const { key } = req.params
        const assignCollectionDto: AssignCollectionDto = req.body
        const data = await CollectionService.assignCollection(key, assignCollectionDto, req.user)
        return res.json(data)
    }
}

export default CollectionController
