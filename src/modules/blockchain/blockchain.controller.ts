import { Request, Response } from 'express'
import BlockchainService from './blockchain.service'
import { CreateSignatureDto, SendRawDto } from './blockchain.dto'
import { CustomRequest } from '@middlewares/request.middleware'
import { ITransactionFilter } from '@modules/transaction/transaction.interface'
import { downloadResource } from '@utils/utility'

export default class BlockchainController {
    static async createRawWallet(req: Request, res: Response) {
        const params: CreateSignatureDto = req.body
        const data = await BlockchainService.createRawWallet(params)

        return res.json(data)
    }

    static async generateSignature(req: Request, res: Response) {
        const params: CreateSignatureDto = req.body
        const data = await BlockchainService.generateSignature(params)

        return res.json(data)
    }

    static async send(req: Request, res: Response) {
        const params: SendRawDto = req.body
        const data = await BlockchainService.send(params)

        return res.json(data)
    }

    static async queryPrimeTxns(req: CustomRequest, res: Response) {
        const symbol: string = req.params.symbol
        const filter = req.query as ITransactionFilter
        const data = await BlockchainService.queryPrimeTxns({
            symbol,
            filter
        })
        return res.json(data)
    }

    static async queryTxns(req: CustomRequest, res: Response) {
        const filter = req.query as ITransactionFilter
        const data = await BlockchainService.queryTxns({ filter })
        return res.json(data)
    }

    static async exportTxns(req: CustomRequest, res: Response) {
        const filter = req.query as ITransactionFilter
        const data = await BlockchainService.queryTxns({ filter })

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

        return downloadResource(res, 'transactions.csv', fields, data.items)
    }

    static async getAccountBySymbolAndAddress(req: CustomRequest, res: Response) {
        const symbol: string = req.params.symbol
        const address: string = req.params.address
        const data = await BlockchainService.getAccountBySymbolAndAddress(symbol, address)
        return res.json(data)
    }

    static async getTxnByKey(req: CustomRequest, res: Response) {
        const key: string = req.params.key
        const data = await BlockchainService.getTxnByKey(key)
        return res.json(data)
    }

    static async queryAccountTxns(req: CustomRequest, res: Response) {
        const address: string = req.params.address
        const filter = req.query as ITransactionFilter
        const data = await BlockchainService.queryAccountTxns({
            address,
            filter
        })
        return res.json(data)
    }

    static async getAllPrimeAccountList(req: CustomRequest, res: Response) {
        const data = await BlockchainService.getAllPrimeAccountList()
        return res.json(data)
    }

    static async getAllPrimeTransactionList(req: CustomRequest, res: Response) {
        const data = await BlockchainService.getAllPrimeTransactionList()
        return res.json(data)
    }

    static async getAllPrimeTransactionStats(req: CustomRequest, res: Response) {
        const data = await BlockchainService.getAllPrimeTransactionStats()
        return res.json(data)
    }

    static async getPrimeAccountList(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol.toUpperCase()
        const data = await BlockchainService.getPrimeAccountList(symbol)
        return res.json(data)
    }

    static async getPrimeTransactionList(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol.toUpperCase()
        const data = await BlockchainService.getPrimeTransactionList(symbol)
        return res.json(data)
    }

    static async getPrimeTransactionStats(req: CustomRequest, res: Response) {
        const symbol = req.params.symbol.toUpperCase()
        const data = await BlockchainService.getPrimeTransactionStats(symbol)
        return res.json(data)
    }
}
