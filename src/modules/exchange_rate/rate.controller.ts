import { Response } from 'express'
import { CustomRequest } from '@middlewares/request.middleware'
import RateService from './rate.service'

export default class RateController {
    static async getAllRates(req: CustomRequest, res: Response) {
        const data = await RateService.getAllRates()
        return res.json(data)
    }

    static async getRate(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol
        const data = await RateService.getRate(symbol)
        return res.json(data)
    }

    static async getRateLogs(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol
        const data = await RateService.getRateLogs(symbol)
        return res.json(data)
    }
}
