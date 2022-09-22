import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CreateCollectionDto } from './collection.dto'
import { requireAuth } from '@utils/authCheck'

import Multer from 'multer'
import CollectionController from './collection.controller'
import { requireAdmin } from '@config/role'
const upload = Multer()

export default class CollectionRouter implements ICustomRouter {
    public path = '/collections'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(
            `${this.path}`,
            requireAuth,
            upload.any(),
            validationMiddleware(CreateCollectionDto),
            asyncHandler(CollectionController.createCollection)
        )
        this.router.get(`${this.path}/`, asyncHandler(CollectionController.queryCollections))
        this.router.get(`${this.path}/featured`, asyncHandler(CollectionController.getCollectionFeatured))
        this.router.get(`${this.path}/:key`, asyncHandler(CollectionController.getCollectionDetail))
        this.router.delete(`${this.path}/:key`, requireAuth, asyncHandler(CollectionController.deleteCollection))
        this.router.put(`${this.path}/featured`, requireAuth, requireAdmin(), asyncHandler(CollectionController.bulkUpdateCollectionFeatured))
        this.router.put(`${this.path}/:key`, requireAuth, upload.any(), asyncHandler(CollectionController.updateCollection))
        this.router.get(`${this.path}/user/:key`, asyncHandler(CollectionController.queryUserCollections))
        this.router.put(`${this.path}/:key/assign`, requireAuth, asyncHandler(CollectionController.assignCollection))
        this.router.put(`${this.path}/:key/featured`, requireAuth, requireAdmin(), asyncHandler(CollectionController.updateCollectionFeatured))
    }
}
