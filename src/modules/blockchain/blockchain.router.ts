import asyncHandler from '@utils/asyncHandler'
import { Router } from 'express'
import ICustomRouter from '@interfaces/custom.router.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import { CreateRawWalletDto, CreateSignatureDto, SendRawDto } from './blockchain.dto'
import BlockchainController from './blockchain.controller'

class BlockchainRouter implements ICustomRouter {
    public path = '/blockchain'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    // all public
    private initRoutes() {
        this.router.post(`${this.path}/new`, validationMiddleware(CreateRawWalletDto), asyncHandler(BlockchainController.createRawWallet))
        this.router.post(`${this.path}/signature`, validationMiddleware(CreateSignatureDto), asyncHandler(BlockchainController.generateSignature))
        this.router.post(`${this.path}/send`, validationMiddleware(SendRawDto), asyncHandler(BlockchainController.send))
        this.router.get(`${this.path}/:symbol/txns`, asyncHandler(BlockchainController.queryPrimeTxns))
        this.router.get(`${this.path}/txns`, asyncHandler(BlockchainController.queryTxns))
        this.router.get(`${this.path}/txns/export`, asyncHandler(BlockchainController.exportTxns))
        this.router.get(`${this.path}/:symbol/address/:address`, asyncHandler(BlockchainController.getAccountBySymbolAndAddress))
        this.router.get(`${this.path}/transaction/:key`, asyncHandler(BlockchainController.getTxnByKey))
        this.router.get(`${this.path}/account/:address/txns`, asyncHandler(BlockchainController.queryAccountTxns))

        this.router.get(`${this.path}/accounts/prime/list`, asyncHandler(BlockchainController.getAllPrimeAccountList))
        this.router.get(`${this.path}/:symbol/accounts/prime/list`, asyncHandler(BlockchainController.getPrimeAccountList))

        this.router.get(`${this.path}/transactions/prime/list`, asyncHandler(BlockchainController.getAllPrimeTransactionList))
        this.router.get(`${this.path}/transactions/prime/stats`, asyncHandler(BlockchainController.getAllPrimeTransactionStats))
        this.router.get(`${this.path}/:symbol/transactions/prime/list`, asyncHandler(BlockchainController.getPrimeTransactionList))
        this.router.get(`${this.path}/:symbol/transactions/prime/stats`, asyncHandler(BlockchainController.getPrimeTransactionStats))
    }
}

export default BlockchainRouter
