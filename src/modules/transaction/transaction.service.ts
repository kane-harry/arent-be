import AccountService from '@modules/account/account.service'
import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { SendPrimeCoinsDto } from './transaction.dto'
import { toUpper, trim } from 'lodash'
import { AccountErrors, TransactionErrors } from '@exceptions/custom.error'
import { decryptKeyWithSalt, signMessage } from '@utils/wallet'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { ISendCoinDto, ITransactionFilter } from './transaction.interface'
import { parsePrimeAmount } from '@utils/number'
import { IUser } from '@modules/user/user.interface'
import { isAdmin } from '@config/role'
import SettingService from '@modules/setting/setting.service'
import { ISetting } from '@modules/setting/setting.interface'
import { UserStatus } from '@config/constants'

export default class TransactionService {
    static async sendPrimeCoins(params: SendPrimeCoinsDto, operator: IUser) {
        params.notes = params.notes || ''
        const symbol = toUpper(trim(params.symbol))

        // parse to unit with decimals
        const amount = parsePrimeAmount(params.amount)

        // this should be store as a string in wei (big number - string)
        const senderAccount = await AccountService.getAccountDetailByFields({ symbol, address: params.sender })
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
        if (operator.key !== senderAccount?.user_key) {
            if (senderAccount.type === 'MASTER' && isAdmin(operator.role)) {
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
        const senderBalance = parsePrimeAmount(senderAccount.amount).sub(parsePrimeAmount(senderAccount.amount_locked))
        if (senderBalance.lt(amount)) {
            throw new BizException(
                TransactionErrors.sender_insufficient_balance_error,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender, balance: senderAccount.amount, amount })
            )
        }
        const setting: ISetting = await SettingService.getGlobalSetting()
        const transferFee = Number(setting.prime_transfer_fee || 0)
        const transferFeeBig = parsePrimeAmount(transferFee)

        if (amount.lt(transferFeeBig)) {
            throw new BizException(
                TransactionErrors.send_amount_less_than_fee_error,
                new ErrorContext('transaction.service', 'sendPrimeCoins', { sender: params.sender, balance: senderAccount.amount, amount })
            )
        }
        const senderKeyStore = await AccountService.getAccountKeyStore(senderAccount.key)
        const privateKey = await decryptKeyWithSalt(senderKeyStore.key_store, senderKeyStore.salt)
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
            fee_address: masterAccount.address,
            fee: String(transferFee),
            mode: params.mode
        }
        return await PrimeCoinProvider.sendPrimeCoins(sendData)
    }

    static async queryTxns(filter: ITransactionFilter) {
        return await PrimeCoinProvider.queryPrimeTxns(filter)
    }

    static async queryTxnsByAccount(key: string, filter: ITransactionFilter) {
        const account = await AccountService.getAccountDetailByFields({ key })
        if (account) {
            filter.symbol = account.symbol
            filter.address = account.address
        }
        const txns = await PrimeCoinProvider.queryPrimeTxns(filter)
        return { account, txns }
    }

    static async getTxnDetails(key: string) {
        let txn = await TransactionService.getLocalTxnByKey(key)
        if (!txn) {
            txn = await PrimeCoinProvider.getPrimeTxnByKey(key)
        }
        return txn
    }

    static async getLocalTxnByKey(id: string) {
        // find txn in fed db
        return null
        // throw new Error('Function not implemented.')
    }
}
