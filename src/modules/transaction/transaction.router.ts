import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import { requireAuth } from '@utils/authCheck'
import validationMiddleware from '@middlewares/validation.middleware'
import { SendPrimeCoinsDto } from './transaction.dto'
import TransactionController from './transaction.controller'
import { requireAdmin } from '@config/role'

export default class TransactionRouter implements ICustomRouter {
    public path = '/transactions'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    private initRoutes() {
        this.router.post(`${this.path}`, requireAuth, validationMiddleware(SendPrimeCoinsDto), asyncHandler(TransactionController.sendPrimeCoins))
        this.router.get(`${this.path}`, asyncHandler(TransactionController.queryTxns)) // get recently txns
        // this.router.get(`${this.path}/accounts/history`, asyncHandler(TransactionController.getTxnHistory))
        this.router.get(`${this.path}/accounts/:key`, asyncHandler(TransactionController.queryTxnsByAccount))
        this.router.get(`${this.path}/:key`, asyncHandler(TransactionController.getTxnDetails))
        this.router.get(`${this.path}/report/export`, requireAuth, requireAdmin(), asyncHandler(TransactionController.exportTxnsByAccount))
        this.router.get('/send/estimatefee', asyncHandler(TransactionController.estimateFee))
    }
}
