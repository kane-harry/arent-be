import asyncHandler from '@common/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CustomRequest } from '@middlewares/request.middleware'
import { WithdrawDto } from './account.dto'
import { IAccountFilter } from './account.interface'
import AccountService from './account.service'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { ITransactionFilter } from '@modules/transaction/transaction.interface'
import TransactionService from '@modules/transaction/transaction.service'
import { downloadResource } from '@utils/utility'
import { requireAuth } from '@common/authCheck'
// import { requireAuth } from '@common/authCheck'

class AccountController implements IController {
    public path = '/accounts'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.get(`${this.path}`, asyncHandler(this.queryAccounts))
        this.router.get(`${this.path}/:key`, asyncHandler(this.getAccountByKey))
        this.router.get(`${this.path}/symbol/:symbol`, requireAuth, asyncHandler(this.getAccountBySymbol))
        this.router.get(`${this.path}/:key/trx/export`, asyncHandler(this.getExportTransactionByAccountKey))
        this.router.get(`${this.path}/user/:userId`, asyncHandler(this.getUserAccounts))
        this.router.post(`${this.path}/:key/withdraw`, validationMiddleware(WithdrawDto), asyncHandler(this.withdraw))
    }

    private async getAccountByKey(req: Request, res: Response) {
        const key = req.params.key
        const data = await AccountService.getAccountByKey(key)
        return res.json(data)
    }

    private async getAccountBySymbol(req: Request, res: Response) {
        const symbol = req.params.symbol
        // @ts-ignore
        const userId = req.user ? req.user.key : ''
        const data = await AccountService.getAccountBySymbol(symbol, userId)
        return res.json(data)
    }

    private async queryAccounts(req: CustomRequest, res: Response) {
        const filter = req.query as IAccountFilter
        const data = await AccountService.queryAccounts(filter)
        return res.json(data)
    }

    private async getUserAccounts(req: CustomRequest, res: Response) {
        const userId = req.params.userId
        const data = await AccountService.getUserAccounts(userId)
        for (const account of data) {
            const coinAccount = await PrimeCoinProvider.getWalletBySymbolAndAddress(account.symbol, account.address)
            if (coinAccount) {
                account.amount = coinAccount.amount
            }
        }
        return res.json(data)
    }

    private async withdraw(req: CustomRequest, res: Response) {
        const key = req.params.key
        const params: WithdrawDto = req.body
        const data = await AccountService.withdraw(key, params)
        return res.json(data)
    }

    private async getExportTransactionByAccountKey(req: CustomRequest, res: Response) {
        const key = req.params.key
        const filter = req.query as ITransactionFilter
        const operator = req.user
        const data = await TransactionService.queryTxnsByAccount(key, filter, operator)

        const fields = [
            { label: 'Key', value: 'key' },
            { label: 'Owner', value: 'owner' },
            { label: 'Symbol', value: 'symbol' },
            { label: 'Sender', value: 'sender' },
            { label: 'Recipient', value: 'recipient' },
            { label: 'Amount', value: 'amount' },
            { label: 'Type', value: 'type' },
            { label: 'Hash', value: 'hash' },
            { label: 'Block', value: 'block' },
            { label: 'Signature', value: 'signature' },
            { label: 'Notes', value: 'notes' },
            { label: 'Created', value: 'created' },
            { label: 'Modified', value: 'modified' }
        ]

        return downloadResource(res, 'transactions.csv', fields, data.txns.items)
    }
}

export default AccountController
