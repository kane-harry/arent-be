import asyncHandler from '../../common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '../../interfaces/controller.interface'
import validationMiddleware from '../../middlewares/validation.middleware'
import CoinService from './coin.service'
import { CreateRawWalletDto, CreateSignatureDto, SendRawDto } from './coin.dto'
import { CustomRequest } from '../../middlewares/request.middleware'
import { ITransactionFilter } from '../transaction/transaction.interface'

class TransactionController implements IController {
    public path = '/coin'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    // all public
    private initRoutes() {
        this.router.post(`${this.path}/new`, validationMiddleware(CreateRawWalletDto), asyncHandler(this.createRawWallet))
        this.router.post(`${this.path}/signature`, validationMiddleware(CreateSignatureDto), asyncHandler(this.generateSignature))
        this.router.post(`${this.path}/sendraw`, validationMiddleware(SendRawDto), asyncHandler(this.sendRaw))
        this.router.get(`${this.path}/:symbol/txns`, asyncHandler(this.queryPrimeTxns))
    }

    private async createRawWallet(req: Request, res: Response) {
        const params: CreateSignatureDto = req.body
        const data = await CoinService.createRawWallet(params)

        return res.json(data)
    }

    private async generateSignature(req: Request, res: Response) {
        const params: CreateSignatureDto = req.body
        const data = await CoinService.generateSignature(params)

        return res.json(data)
    }

    private async sendRaw(req: Request, res: Response) {
        const params: SendRawDto = req.body
        const data = await CoinService.sendRaw(params)

        return res.json(data)
    }

    private async queryPrimeTxns(req: CustomRequest, res: Response) {
        const symbol: string = req.params.symbol
        const filter = req.query as ITransactionFilter
        const data = await CoinService.queryPrimeTxns(symbol, filter)
        return res.json(data)
    }
}

export default TransactionController