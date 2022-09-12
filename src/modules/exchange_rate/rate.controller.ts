import asyncHandler from '@utils/asyncHandler'
import { Router, Response } from 'express'
import IController from '@interfaces/controller.interface'
import { CustomRequest } from '@middlewares/request.middleware'
import RateService from './rate.service'

class RateController implements IController {
    public path = '/rates'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}`, asyncHandler(this.getAllRates))
        this.router.get(`${this.path}/:symbol`, asyncHandler(this.getRate))
        this.router.get(`${this.path}/:symbol/logs`, asyncHandler(this.getRateLogs))
    }

    private async getAllRates(req: CustomRequest, res: Response) {
        const data = await RateService.getAllRates()
        return res.json(data)
    }

    private async getRate(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol
        const data = await RateService.getRate(symbol)
        return res.json(data)
    }

    private async getRateLogs(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol
        const data = await RateService.getRateLogs(symbol)
        return res.json(data)
    }
}

export default RateController
