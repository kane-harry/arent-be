import { Router, Request, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
import IController from '@interfaces/controller.interface'
import NftService from './nft.service'
import { CreateNftDto, ImportNftDto } from './nft.dto'
import { requireAuth } from '@utils/authCheck'
import validationMiddleware from '@middlewares/validation.middleware'
import { IUser } from '@modules/user/user.interface'
import { requireAdmin } from '@config/role'
import { handleFiles, resizeImages, uploadFiles } from '@middlewares/files.middleware'
import { AuthenticationRequest } from '@middlewares/request.middleware'

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
            requireAdmin(),
            asyncHandler(
                handleFiles([
                    { name: 'nft', maxCount: 1 },
                    { name: 'images', maxCount: 1 }
                ])
            ),
            asyncHandler(
                resizeImages({
                    nft: [{ maxSize: 300, id: 'thumb' }],
                    images: [{ maxSize: 1280, id: 'lg' }]
                })
            ),
            asyncHandler(uploadFiles('nft')),
            asyncHandler(uploadFiles('images')),
            asyncHandler(this.createNft)
        )
        this.router.post(`${this.path}/external/import`, requireAuth, validationMiddleware(ImportNftDto), asyncHandler(this.importNft))
    }

    private async importNft(req: Request, res: Response) {
        const payload: ImportNftDto = req.body // should be an arrary since we support bulk import
        const operator = req.user as IUser
        const data = await NftService.importNft(payload, operator)
        return res.send(data)
    }

    private createNft = async (req: AuthenticationRequest, res: Response) => {
        const createNftDto: CreateNftDto = req.body
        const nft = await NftService.createNft(createNftDto, req.user)
        return res.send(nft)
    }
}

export default NftController
