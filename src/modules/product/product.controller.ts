import { Router, Request, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
import IController from '@interfaces/controller.interface'
import ProductService from './product.service'
import { ImportProductDto } from './product.dto'
import { requireAuth } from '@utils/authCheck'
import validationMiddleware from '@middlewares/validation.middleware'
import { IUser } from '@modules/user/user.interface'

class SiteController implements IController {
    public path = '/products'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}/external/import`, requireAuth, validationMiddleware(ImportProductDto), asyncHandler(this.importProduct))
    }

    private async importProduct(req: Request, res: Response) {
        const payload: ImportProductDto = req.body // should be an arrary since we support bulk import
        const operator = req.user as IUser
        const data = await ProductService.importProduct(payload, operator)
        return res.send(data)
    }
}

export default SiteController
