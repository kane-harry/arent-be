import asyncHandler from '@utils/asyncHandler'
import { Router, Request, Response } from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import BlockchainService from './blockchain.service'
import { CreateRawWalletDto, CreateSignatureDto, SendRawDto } from './blockchain.dto'
import { CustomRequest } from '@middlewares/request.middleware'
import { ITransactionFilter } from '@modules/transaction/transaction.interface'

class BlockchainController implements IController {
    public path = '/blockchain'
    public router = Router()

    constructor() {
        this.initRoutes()
    }

    // all public
    private initRoutes() {
        this.router.post(`${this.path}/new`, validationMiddleware(CreateRawWalletDto), asyncHandler(this.createRawWallet))
        this.router.post(`${this.path}/signature`, validationMiddleware(CreateSignatureDto), asyncHandler(this.generateSignature))
        this.router.post(`${this.path}/send`, validationMiddleware(SendRawDto), asyncHandler(this.send))
        this.router.get(`${this.path}/:symbol/txns`, asyncHandler(this.queryPrimeTxns))
        this.router.get(`${this.path}/txns`, asyncHandler(this.queryTxns))
        this.router.get(`${this.path}/:symbol/address/:address`, asyncHandler(this.getAccountBySymbolAndAddress))
        this.router.get(`${this.path}/transaction/:key`, asyncHandler(this.getTxnByKey))
        this.router.get(`${this.path}/account/:address/txns`, asyncHandler(this.queryAccountTxns))

        this.router.get(`${this.path}/accounts/prime/list`, asyncHandler(this.getAllPrimeAccountList))
        this.router.get(`${this.path}/:symbol/accounts/prime/list`, asyncHandler(this.getPrimeAccountList))

        this.router.get(`${this.path}/transactions/prime/list`, asyncHandler(this.getAllPrimeTransactionList))
        this.router.get(`${this.path}/transactions/prime/stats`, asyncHandler(this.getAllPrimeTransactionStats))
        this.router.get(`${this.path}/:symbol/transactions/prime/list`, asyncHandler(this.getPrimeTransactionList))
        this.router.get(`${this.path}/:symbol/transactions/prime/stats`, asyncHandler(this.getPrimeTransactionStats))
    }

    private async createRawWallet(req: Request, res: Response) {
        const params: CreateSignatureDto = req.body
        const data = await BlockchainService.createRawWallet(params)

        return res.json(data)
    }

    private async generateSignature(req: Request, res: Response) {
        const params: CreateSignatureDto = req.body
        const data = await BlockchainService.generateSignature(params)

        return res.json(data)
    }

    private async send(req: Request, res: Response) {
        const params: SendRawDto = req.body
        const data = await BlockchainService.send(params)

        return res.json(data)
    }

    private async queryPrimeTxns(req: CustomRequest, res: Response) {
        const symbol: string = req.params.symbol
        const filter = req.query as ITransactionFilter
        const data = await BlockchainService.queryPrimeTxns({
            symbol,
            filter
        })
        return res.json(data)
    }

    private async queryTxns(req: CustomRequest, res: Response) {
        const filter = req.query as ITransactionFilter
        const data = await BlockchainService.queryTxns({ filter })
        return res.json(data)
    }

    private async getAccountBySymbolAndAddress(req: CustomRequest, res: Response) {
        const symbol: string = req.params.symbol
        const address: string = req.params.address
        const data = await BlockchainService.getAccountBySymbolAndAddress(symbol, address)
        return res.json(data)
    }

    private async getTxnByKey(req: CustomRequest, res: Response) {
        const key: string = req.params.key
        const data = await BlockchainService.getTxnByKey(key)
        return res.json(data)
    }

    private async queryAccountTxns(req: CustomRequest, res: Response) {
        const address: string = req.params.address
        const filter = req.query as ITransactionFilter
        const data = await BlockchainService.queryAccountTxns({
            address,
            filter
        })
        return res.json(data)
    }

    private async getAllPrimeAccountList(req: CustomRequest, res: Response) {
        const data = await BlockchainService.getAllPrimeAccountList()
        return res.json(data)
    }

    private async getAllPrimeTransactionList(req: CustomRequest, res: Response) {
        const data = await BlockchainService.getAllPrimeTransactionList()
        return res.json(data)
    }

    private async getAllPrimeTransactionStats(req: CustomRequest, res: Response) {
        const data = await BlockchainService.getAllPrimeTransactionStats()
        return res.json(data)
    }

    private async getPrimeAccountList(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol.toUpperCase()
        const data = await BlockchainService.getPrimeAccountList(symbol)
        return res.json(data)
    }

    private async getPrimeTransactionList(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol.toUpperCase()
        const data = await BlockchainService.getPrimeTransactionList(symbol)
        return res.json(data)
    }

    private async getPrimeTransactionStats(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol.toUpperCase()
        const data = await BlockchainService.getPrimeTransactionStats(symbol)
        return res.json(data)
    }
}

export default BlockchainController
