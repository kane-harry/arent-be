import { Router, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
import IController from '@interfaces/controller.interface'
import CollectionService from './collection.service'
import { CreateCollectionDto } from './collection.dto'
import { requireAuth } from '@utils/authCheck'
import { handleFiles, uploadFiles } from '@middlewares/files.middleware'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import { ICollectionFilter } from '@modules/collection/collection.interface'

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
}

export default CollectionController
