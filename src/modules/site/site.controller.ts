import { Router, Request, Response } from 'express'
import asyncHandler from '@common/asyncHandler'
import IController from '@interfaces/controller.interface'
import SiteService from './site.service'

class SiteController implements IController {
    public path = '/sites'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}/fed/hello`, asyncHandler(this.federationHeartBeat))
        this.router.get(`${this.path}/coin/hello`, asyncHandler(this.coinServerHeartBeat))
    }

    private async federationHeartBeat(req: Request, res: Response) {
        return res.send('Hello,Federation !')
    }

    private async coinServerHeartBeat(req: Request, res: Response) {
        const data = await SiteService.coinServerHeartBeat()
        return res.send(data)
    }
}

export default SiteController
