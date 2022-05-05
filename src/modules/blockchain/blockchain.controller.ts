import asyncHandler from '@common/asyncHandler'
import {Router, Request, Response} from 'express'
import IController from '@interfaces/controller.interface'
import validationMiddleware from '@middlewares/validation.middleware'
import BlockchainService from './blockchain.service'
import {CreateRawWalletDto, CreateSignatureDto, SendRawDto} from './blockchain.dto'
import {CustomRequest} from '@middlewares/request.middleware'
import {ITransactionFilter} from '@modules/transaction/transaction.interface'

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
        this.router.post(`${this.path}/sendraw`, validationMiddleware(SendRawDto), asyncHandler(this.sendRaw))
        this.router.get(`${this.path}/:symbol/txns`, asyncHandler(this.queryPrimeTxns))
        this.router.get(`${this.path}/:symbol/address/:address`, asyncHandler(this.getAccountBySymbolAndAddress))
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

    private async sendRaw(req: Request, res: Response) {
        const params: SendRawDto = req.body
        const data = await BlockchainService.sendRaw(params)

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

    private async getAccountBySymbolAndAddress(req: CustomRequest, res: Response) {
        const symbol: string = req.params.symbol
        const address: string = req.params.address
        const data = await BlockchainService.getAccountBySymbolAndAddress(symbol, address)
        return res.json(data)
    }
}

export default BlockchainController
