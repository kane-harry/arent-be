import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import SiteController from './site.controller'

export default class SiteRouter implements ICustomRouter {
    public path = '/sites'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}/fed/hello`, asyncHandler(SiteController.federationHeartBeat))
        this.router.get(`${this.path}/coin/hello`, asyncHandler(SiteController.coinServerHeartBeat))
        this.router.get(`${this.path}/market/search`, asyncHandler(SiteController.searchMarket))
    }
}
