import { Request, Response } from 'express'
import SiteService from './site.service'

export default class SiteController {
    static async federationHeartBeat(req: Request, res: Response) {
        return res.send('Hello,Federation !')
    }

    static async coinServerHeartBeat(req: Request, res: Response) {
        const data = await SiteService.coinServerHeartBeat()
        return res.send(data)
    }

    static async searchMarket(req: Request, res: Response) {
        const scopes = String(req.query.scopes || '')
        const terms = String(req.query.terms || '')
        const limit = Number(req.query.limit || 10)
        const data = await SiteService.searchMarket(scopes, terms, limit)
        return res.send(data)
    }
}
