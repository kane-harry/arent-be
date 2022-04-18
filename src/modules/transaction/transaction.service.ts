import AccountService from '../account/account.service'
import BizException from '../../exceptions/biz.exception'
import ErrorContext from '../../exceptions/error.context'
import { SendPrimeCoinsDto } from './transaction.dto'
import { trim, toUpper } from 'lodash'
import { AccountErrors, TransactionErrors } from '../../exceptions/custom.error'
import { decryptKeyWithSalt, signMessage } from '../../utils/wallet'
import { sendPrimeCoins, queryPrimeTxns, getPrimeTxnByKey, getWalletBySymbolAndAddress } from '../../providers/coin.provider'
import { ISendCoinDto, ITransactionFilter } from './transaction.interface'
import { AccountExtType } from '../account/account.interface'

export default class TransactionService {
    static async sendPrimeCoins(params: SendPrimeCoinsDto, operator: Express.User | undefined) {
        // TODO: check account owner = operator
        const symbol = toUpper(trim(params.symbol))
        const sendAmount = Number(params.amount)
        const senderAccount = await AccountService.getAccountBySymbolAndAddress(symbol, params.sender)
        // recipient can be raw wallet
        const recipientWallet = await getWalletBySymbolAndAddress(params.symbol, params.recipient)
        if (!senderAccount) {
            throw new BizException(
                TransactionErrors.sender_account_not_exists_error,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender })
            )
        }
        if (!recipientWallet) {
            throw new BizException(
                TransactionErrors.recipient_account_not_exists_error,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { recipient: params.recipient })
            )
        }
        const senderBalance = Number(senderAccount.amount) - Number(senderAccount.amountLocked)
        if (senderBalance < sendAmount) {
            throw new BizException(
                TransactionErrors.sender_insufficient_balance_error,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender, balance: senderAccount.amount, sendAmount })
            )
        }
        const senderKeyStore = await AccountService.getAccountKeyStore(senderAccount.key)
        const privateKey = await decryptKeyWithSalt(senderKeyStore.keyStore, senderKeyStore.salt)
        let nonce = senderAccount.nonce || 0
        nonce = nonce + 1
        const message = `${symbol}:${params.sender}:${params.recipient}:${params.amount}:${nonce}:${params.notes}`
        const signature = await signMessage(privateKey, message)
        const sendData: ISendCoinDto = {
            symbol: symbol,
            sender: params.sender,
            recipient: params.recipient,
            amount: String(sendAmount),
            nonce: String(nonce),
            type: 'TRANSFER',
            signature: signature,
            notes: params.notes,
            details: {}
        }
        const data = await sendPrimeCoins(sendData)
        return data
    }

    static async queryTxnsByAccount(key: string, filter: ITransactionFilter, operator: Express.User | undefined) {
        const account = await AccountService.getAccountByKey(key)
        if (!account) {
            throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('transaction.service', 'getTxnsByAccount', { key }))
        }
        filter.symbol = account.symbol
        // TODO: Check role/owner - admin and owner can view txns
        if (account.extType === AccountExtType.Prime) {
            filter.owner = account.extKey
            const txns = await queryPrimeTxns(filter)
            return { account, txns }
        }
        // get txns from federation db
        filter.owner = account.key
        const txns = await TransactionService.queryExtTxns(filter)
        return { account, txns }
    }

    static async getTxnDetails(key: string, id: string) {
        const account = await AccountService.getAccountByKey(key)
        if (!account) {
            throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('transaction.service', 'getTxnsByAccount', { key }))
        }
        if (account.extType === AccountExtType.Prime) {
            const txn = await getPrimeTxnByKey(id)
            return txn
        }
        const txn = await TransactionService.getExtTrxByKey(id)
        return txn
    }

    static async queryExtTxns(filter: ITransactionFilter) {
        throw new Error('Method not implemented.')
    }

    static async getExtTrxByKey(id: string) {
        throw new Error('Function not implemented.')
    }
}
