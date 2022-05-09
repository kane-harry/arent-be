import asyncHandler from '@common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CustomRequest } from '@middlewares/request.middleware'
import TransactionService from './transaction.service'
import { SendPrimeCoinsDto } from './transaction.dto'
import { ITransactionFilter } from './transaction.interface'
import {downloadResource} from "@utils/utility";

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
        this.router.get(`${this.path}/export`, asyncHandler(this.exportTxnsByAccount))
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

    private async exportTxnsByAccount(req: CustomRequest, res: Response) {
        const key: string = req.query.key
        const filter = req.query as ITransactionFilter
        const operator = req.user
        const data = await TransactionService.queryTxnsByAccount(key, filter, operator)

        const fields = [
            {label: 'Key', value: 'key'},
            {label: 'Owner', value: 'owner'},
            {label: 'Symbol', value: 'symbol'},
            {label: 'Sender', value: 'sender'},
            {label: 'Recipient', value: 'recipient'},
            {label: 'Amount', value: 'amount'},
            {label: 'Type', value: 'type'},
            {label: 'Hash', value: 'hash'},
            {label: 'Block', value: 'block'},
            {label: 'Signature', value: 'signature'},
            {label: 'Notes', value: 'notes'},
            {label: 'Created', value: 'created'},
            {label: 'Modified', value: 'modified'},
        ];

        return downloadResource(res, 'transactions.csv', fields, data.txns.items);
    }
}

export default TransactionController
