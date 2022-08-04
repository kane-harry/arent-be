import { Router, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
import IController from '@interfaces/controller.interface'
import CollectionService from './collection.service'
import { CreateCollectionDto, UpdateCollectionDto } from './collection.dto'
import { requireAuth } from '@utils/authCheck'
import { handleFiles, uploadFiles } from '@middlewares/files.middleware'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { ICollectionFilter } from '@modules/collection/collection.interface'
import { CollectionModel } from '@modules/collection/collection.model'
import { isAdmin } from '@config/role'
import BizException from '@exceptions/biz.exception'
import { AccountErrors, AuthErrors, CollectionErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { NftModel } from '@modules/nft/nft.model'

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
                    { name: 'logo', maxCount: 1 },
                    { name: 'background', maxCount: 1 }
                ])
            ),
            asyncHandler(uploadFiles('logo')),
            asyncHandler(uploadFiles('background')),
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
                    { name: 'logo', maxCount: 1 },
                    { name: 'background', maxCount: 1 }
                ])
            ),
            asyncHandler(uploadFiles('logo')),
            asyncHandler(uploadFiles('background')),
            asyncHandler(this.updateCollection)
        )
        this.router.get(`${this.path}/user/:key`, asyncHandler(this.queryUserCollections))
    }

    private createCollection = async (req: AuthenticationRequest, res: Response) => {
        const createCollectionDto: CreateCollectionDto = req.body
        if (res?.locals?.files_uploaded?.length) {
            const logo = res.locals.files_uploaded.find((item: any) => item.type === 'original' && item.fieldname === 'logo')
            createCollectionDto.logo = logo?.key
            const background = res.locals.files_uploaded.find((item: any) => item.type === 'original' && item.fieldname === 'background')
            createCollectionDto.background = background?.key
        }
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
        const data = await CollectionModel.findOne({ key })
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
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(CollectionErrors.collection_not_exists_error, new ErrorContext('collection.service', 'updateCollection', { key }))
        }
        if (!isAdmin(req.user?.role) && req.user?.key !== collection.owner) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('collection.service', 'updateCollection', { key }))
        }
        if (updateCollectionDto.name) {
            collection.set('name', updateCollectionDto.name, String)
        }
        if (updateCollectionDto.description) {
            collection.set('description', updateCollectionDto.description, String)
        }
        if (updateCollectionDto.owner) {
            collection.set('owner', updateCollectionDto.owner, String)
        }
        if (updateCollectionDto.logo) {
            collection.set('logo', updateCollectionDto.logo, String)
        }
        if (updateCollectionDto.background) {
            collection.set('background', updateCollectionDto.background, String)
        }
        await collection.save()
        return res.json(collection)
    }

    private deleteCollection = async (req: AuthenticationRequest, res: Response) => {
        const key = req.params.key
        const collection = await CollectionModel.findOne({ key })
        if (!collection) {
            throw new BizException(CollectionErrors.collection_not_exists_error, new ErrorContext('collection.service', 'updateCollection', { key }))
        }
        if (!isAdmin(req.user?.role) && req.user?.key !== collection.owner) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('collection.service', 'updateCollection', { key }))
        }
        const nfts = await NftModel.find({ collection_key: collection.key, on_market: true })
        if (nfts.length) {
            throw new BizException(
                CollectionErrors.collection_has_approved_nfts,
                new ErrorContext('collection.service', 'updateCollection', { nfts })
            )
        }
        collection.set('removed', true, Boolean)
        await collection.save()
        return res.json(collection)
    }

    private async queryUserCollections(req: CustomRequest, res: Response) {
        const { key } = req.params
        const filter = req.query as ICollectionFilter
        filter.owner = key
        const data = await CollectionService.queryCollections(filter)
        return res.json(data)
    }
}

export default CollectionController
