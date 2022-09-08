import { Router, Request, Response } from 'express'
import asyncHandler from '@utils/asyncHandler'
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
        this.router.get(`${this.path}/market/search`, asyncHandler(this.searchMarket))
    }

    private async federationHeartBeat(req: Request, res: Response) {
        return res.send('Hello,Federation !')
    }

    private async coinServerHeartBeat(req: Request, res: Response) {
        const data = await SiteService.coinServerHeartBeat()
        return res.send(data)
    }

    private async searchMarket(req: Request, res: Response) {
        const scopes = String(req.query.scopes || '')
        const terms = String(req.query.terms || '')
        const limit = Number(req.query.limit || 10)
        const data = await SiteService.searchMarket(scopes, terms, limit)
        return res.send(data)
    }
}

export default SiteController
