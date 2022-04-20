import asyncHandler from '@common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CustomRequest } from '@middlewares/request.middleware'
import TransactionService from './transaction.service'
import { SendPrimeCoinsDto } from './transaction.dto'
import { ITransactionFilter } from './transaction.interface'

class TransactionController implements IController {
    public path = '/transactions'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}/send`, validationMiddleware(SendPrimeCoinsDto), asyncHandler(this.sendPrimeCoins))
        this.router.get(`${this.path}/accounts/:key`, asyncHandler(this.queryTxnsByAccount))
        this.router.get(`${this.path}/accounts/:key/txn/:id`, asyncHandler(this.getTxnDetails))
    }

    private async sendPrimeCoins(req: Request, res: Response) {
        const params: SendPrimeCoinsDto = req.body
        const operator = req.user
        const data = await TransactionService.sendPrimeCoins(params, operator)

        return res.json(data)
    }

    private async queryTxnsByAccount(req: CustomRequest, res: Response) {
        const key: string = req.params.key
        const filter = req.query as ITransactionFilter
        const operator = req.user
        const data = await TransactionService.queryTxnsByAccount(key, filter, operator)
        return res.json(data)
    }

    private async getTxnDetails(req: Request, res: Response) {
        const key: string = req.params.key
        const id: string = req.params.id
        const data = await TransactionService.getTxnDetails(key, id)

        return res.json(data)
    }
}

export default TransactionController
