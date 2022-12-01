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
        const begin = parseInt(req.query.begin || 0)
        const end = parseInt(req.query.end || 0)
        const data = await RateService.getRateLogs(symbol, begin, end)
        return res.json(data)
    }
}
