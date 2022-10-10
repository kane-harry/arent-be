import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import RateController from './rate.controller'

export default class RateRouter implements ICustomRouter {
    public path = '/rates'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}`, asyncHandler(RateController.getAllRates))
        this.router.get(`${this.path}/:symbol`, asyncHandler(RateController.getRate))
        this.router.get(`${this.path}/:symbol/logs`, asyncHandler(RateController.getRateLogs))
    }
}
