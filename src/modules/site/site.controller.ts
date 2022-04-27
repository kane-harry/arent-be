import { Router, Request, Response } from 'express'
import asyncHandler from '@common/asyncHandler'
import IController from '@interfaces/controller.interface'

class SiteController implements IController {
    public path = '/sites'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}/hello`, asyncHandler(this.heartBeat))
    }

    private async heartBeat(req: Request, res: Response) {
        return res.send('Hello,Federation !')
    }
}

export default SiteController
