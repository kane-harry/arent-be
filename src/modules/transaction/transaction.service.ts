import AccountService from '@modules/account/account.service'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { SendPrimeCoinsDto } from './transaction.dto'
import { toUpper, trim } from 'lodash'
import { AccountErrors, TransactionErrors } from '@exceptions/custom.error'
import { decryptKeyWithSalt, signMessage } from '@utils/wallet'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { ISendCoinDto, ITransactionFilter } from './transaction.interface'
import { AccountExtType } from '@modules/account/account.interface'
import { config } from '@config'
import { formatAmount, parsePrimeAmount } from '@utils/number'
import { IUser, UserStatus } from '@modules/user/user.interface'
import { isAdmin } from '@config/role'
import SettingService from '@modules/setting/setting.service'

export default class TransactionService {
    static async sendPrimeCoins(params: SendPrimeCoinsDto, operator: IUser) {
        params.notes = params.notes || ''
        const symbol = toUpper(trim(params.symbol))

        // parse to unit with decimals
        const amount = parsePrimeAmount(params.amount)

        // this should be store as a string in wei (big number - string)
        const senderAccount = await AccountService.getAccountBySymbolAndAddress(symbol, params.sender)
        // recipient can be raw wallet
        const recipientWallet = await PrimeCoinProvider.getWalletBySymbolAndAddress(symbol, params.recipient)
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
        if (operator.key !== senderAccount?.userId) {
            if (senderAccount.userId === 'MASTER' && isAdmin(operator.role)) {
                // continue
            } else {
                throw new BizException(
                    TransactionErrors.sender_account_not_own_wallet_error,
                    new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender, email: operator.email })
                )
            }
        }
        if (operator?.status === UserStatus.Suspend) {
            throw new BizException(
                TransactionErrors.account_is_suspend,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender })
            )
        }
        const senderBalance = parsePrimeAmount(senderAccount.amount).sub(parsePrimeAmount(senderAccount.amountLocked))
        if (senderBalance.lt(amount)) {
            throw new BizException(
                TransactionErrors.sender_insufficient_balance_error,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender, balance: senderAccount.amount, amount })
            )
        }
        const setting:any = await SettingService.getGlobalSetting()
        const transferFee = Number(setting.primeTransferFee || 0)
        const transferFeeBig = parsePrimeAmount(transferFee)

        if (amount.lt(transferFeeBig)) {
            throw new BizException(
                TransactionErrors.send_amount_less_than_fee_error,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender, balance: senderAccount.amount, amount })
            )
        }
        const senderKeyStore = await AccountService.getAccountKeyStore(senderAccount.key)
        const privateKey = await decryptKeyWithSalt(senderKeyStore.keyStore, senderKeyStore.salt)
        let nonce = senderAccount.nonce || 0
        nonce = nonce + 1
        const message = `${symbol}:${params.sender}:${params.recipient}:${params.amount}:${nonce}`
        const signature = await signMessage(privateKey, message)
        const masterAccount = await AccountService.getMasterAccountBriefBySymbol(symbol)
        if (!masterAccount) {
            throw new BizException(
                AccountErrors.master_account_not_exists_error,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender })
            )
        }
        const sendData: ISendCoinDto = {
            symbol: symbol,
            sender: params.sender,
            recipient: params.recipient,
            amount: String(params.amount),
            nonce: String(nonce),
            type: 'TRANSFER',
            signature: signature,
            notes: params.notes,
            details: {}, // addtional info
            feeAddress: masterAccount.address,
            fee: String(transferFee),
            mode: params.mode
        }
        return await PrimeCoinProvider.sendPrimeCoins(sendData)
    }

    static async queryTxnsByAccount(key: string, filter: ITransactionFilter, operator: Express.User | undefined) {
        const account = await AccountService.getAccountByKey(key)
        if (account) {
            filter.symbol = account.symbol
            filter.owner = account.extKey
        }
        const txns = await PrimeCoinProvider.queryPrimeTxns(filter)
        return { account, txns }
    }

    static async getTxnDetails(key: string, id: string) {
        const account = await AccountService.getAccountByKey(key)
        if (!account) {
            throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('transaction.service', 'getTxnsByAccount', { key }))
        }
        if (account.extType === AccountExtType.Prime) {
            const txn = await PrimeCoinProvider.getPrimeTxnByKey(id)
            return txn
        }
        const txn = await TransactionService.getExtTrxByKey(id)
        return txn
    }

    static async getExtTrxByKey(id: string) {
        throw new Error('Function not implemented.')
    }
}
