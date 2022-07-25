import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { CreateRawWalletDto, CreateSignatureDto, SendRawDto } from './blockchain.dto'
import { trim, toUpper } from 'lodash'
import { AccountErrors, TransactionErrors } from '@exceptions/custom.error'
import { createEtherWallet, signMessage } from '@utils/wallet'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { ISendCoinDto, ITransactionFilter } from '@modules/transaction/transaction.interface'
import { FeeMode } from '@config/constants'
import AccountService from '@modules/account/account.service'
import { parsePrimeAmount } from '@utils/number'
import SettingService from '@modules/setting/setting.service'
import { ISetting } from '@modules/setting/setting.interface'

export default class BlockchainService {
    static async createRawWallet(params: CreateRawWalletDto) {
        const etherWallet = await createEtherWallet()
        // TODO : check symbols - should be prime tokens
        const coinWallets = await PrimeCoinProvider.createCoinWallet(params.symbol, etherWallet.address, true)
        const wallets: any[] = []
        for (const wallet of coinWallets) {
            wallets.push({
                symbol: wallet.symbol,
                address: etherWallet.address,
                privateKey: etherWallet.private_key
            })
        }
        return wallets
    }

    static async generateSignature(params: CreateSignatureDto) {
        const symbol = toUpper(trim(params.symbol))
        const message = `${symbol}:${params.sender}:${params.recipient}:${params.amount}:${params.nonce}`
        const signature = await signMessage(params.private_key, message)
        return { signature }
    }

    static async send(params: SendRawDto) {
        const symbol = toUpper(trim(params.symbol))
        const senderWallet = await PrimeCoinProvider.getWalletBySymbolAndAddress(symbol, params.sender)
        const recipientWallet = await PrimeCoinProvider.getWalletBySymbolAndAddress(symbol, params.recipient)
        if (!senderWallet) {
            throw new BizException(
                TransactionErrors.sender_account_not_exists_error,
                new ErrorContext('coin.service', 'sendRaw', { sender: params.sender })
            )
        }
        if (!recipientWallet) {
            throw new BizException(
                TransactionErrors.recipient_account_not_exists_error,
                new ErrorContext('coin.service', 'sendRaw', { recipient: params.recipient })
            )
        }
        const mode = params.mode === 'exclusive' ? FeeMode.Exclusive : FeeMode.Inclusive
        params.mode = mode
        const setting: ISetting = await SettingService.getGlobalSetting()
        const fee = setting.prime_transfer_fee.toString() || 0
        const transferFee = parsePrimeAmount(fee)
        if (mode === FeeMode.Inclusive) {
            const sendAmountWithFee = parsePrimeAmount(params.amount)
            const amountWithoutFee = sendAmountWithFee.sub(transferFee)
            if (amountWithoutFee.lt(0)) {
                throw new BizException(
                    TransactionErrors.send_amount_less_than_fee_error,
                    new ErrorContext('coin.service', 'sendRaw', { sender: params.sender })
                )
            }
        }
        const amount = parsePrimeAmount(params.amount)
        const senderBalance = parsePrimeAmount(senderWallet.amount)
        // calculate send amount
        const amountToSend = mode === FeeMode.Exclusive ? amount.add(transferFee) : amount
        if (senderBalance.lt(amountToSend)) {
            throw new BizException(
                TransactionErrors.sender_insufficient_balance_error,
                new ErrorContext('coin.service', 'sendRaw', { sender: params.sender, balance: senderWallet.amount, amountToSend })
            )
        }
        const masterAccount = await AccountService.getMasterAccountBriefBySymbol(symbol)
        if (!masterAccount) {
            throw new BizException(
                AccountErrors.master_account_not_exists_error,
                new ErrorContext('coin.service', 'sendRaw', { sender: params.sender })
            )
        }
        const sendData: ISendCoinDto = {
            symbol: symbol,
            sender: params.sender,
            recipient: params.recipient,
            amount: String(params.amount),
            nonce: String(params.nonce),
            type: 'TRANSFER',
            signature: params.signature,
            notes: params.notes,
            fee_address: masterAccount.address,
            fee: String(fee),
            mode: mode
        }

        return await PrimeCoinProvider.sendPrimeCoins(sendData)
    }

    static async queryPrimeTxns(params: { symbol: string; filter: ITransactionFilter }) {
        return await PrimeCoinProvider.queryPrimeTxns({
            ...params.filter,
            symbol: params.symbol
        })
    }

    static async queryTxns(params: { filter: ITransactionFilter }) {
        return await PrimeCoinProvider.queryPrimeTxns(params.filter)
    }

    static async getAccountBySymbolAndAddress(symbol: string, address: string) {
        return await PrimeCoinProvider.getWalletBySymbolAndAddress(symbol, address)
    }

    static async getTxnByKey(key: string) {
        return await PrimeCoinProvider.getPrimeTxnByKey(key)
    }

    static async queryAccountTxns(params: { address: string; filter: ITransactionFilter }) {
        return await PrimeCoinProvider.queryPrimeTxns({
            ...params.filter,
            address: params.address
        })
    }

    static async getAllPrimeAccountList() {
        return await PrimeCoinProvider.getAllPrimeAccountList()
    }

    static async getAllPrimeTransactionList() {
        return await PrimeCoinProvider.getAllPrimeTransactionList()
    }

    static async getAllPrimeTransactionStats() {
        return await PrimeCoinProvider.getAllPrimeTransactionStats()
    }

    static async getPrimeAccountList(key: string) {
        return await PrimeCoinProvider.getPrimeAccountList(key)
    }

    static async getPrimeTransactionList(key: string) {
        return await PrimeCoinProvider.getPrimeTransactionList(key)
    }

    static async getPrimeTransactionStats(key: string) {
        return await PrimeCoinProvider.getPrimeTransactionStats(key)
    }

    static async increaseAmount(accountAddress: string, amount: string, type: string, notes: string) {
        return await PrimeCoinProvider.mintPrimeCoins({
            key: accountAddress,
            amount: amount,
            notes: notes,
            type: type || 'DEPOSIT'
        })
    }
}
