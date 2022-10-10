import { Request, Response } from 'express'
import { AuthenticationRequest, CustomRequest } from '@middlewares/request.middleware'
import TransactionService from './transaction.service'
import { SendPrimeCoinsDto } from './transaction.dto'
import { ITransactionFilter } from './transaction.interface'
import { downloadResource } from '@utils/utility'
import UserModel from '@modules/user/user.model'
import IOptions from '@interfaces/options.interface'
import { IOperator } from '@interfaces/operator.interface'

export default class TransactionController {
    static async sendPrimeCoins(req: AuthenticationRequest, res: Response) {
        const params: SendPrimeCoinsDto = req.body
        const options: IOptions = {
            agent: req.agent,
            ip: req.ip
        }
        const session = await UserModel.startSession()
        session.startTransaction()
        try {
            const data = await TransactionService.sendPrimeCoins(params, req.user, options)
            await session.commitTransaction()
            session.endSession()
            return res.json(data)
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }

    static async queryTxns(req: CustomRequest, res: Response) {
        const filter = req.query as ITransactionFilter
        const data = await TransactionService.queryTxns(filter)
        return res.json(data)
    }

    static async queryTxnsByAccount(req: CustomRequest, res: Response) {
        const key: string = req.params.key
        const filter = req.query as ITransactionFilter
        const data = await TransactionService.queryTxnsByAccount(key, filter)
        return res.json(data)
    }

    static async getTxnDetails(req: Request, res: Response) {
        const key: string = req.params.key
        const data = await TransactionService.getTxnDetails(key)

        return res.json(data)
    }

    static async exportTxnsByAccount(req: CustomRequest, res: Response) {
        const key: string = req.query.key
        const filter = req.query as ITransactionFilter
        const data = await TransactionService.queryTxnsByAccount(key, filter)

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
