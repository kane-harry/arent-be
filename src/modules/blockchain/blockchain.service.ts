import BizException from '@exceptions/biz.exception'
import ErrorContext from '@exceptions/error.context'
import { CreateRawWalletDto, CreateSignatureDto, SendRawDto } from './blockchain.dto'
import { trim, toUpper } from 'lodash'
import { AccountErrors, TransactionErrors } from '@exceptions/custom.error'
import { createEtherWallet, signMessage } from '@utils/wallet'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { FeeMode, ISendRawDto, ITransactionFilter } from '@modules/transaction/transaction.interface'
import { config } from '@config'
import AccountService from '@modules/account/account.service'

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
                privateKey: etherWallet.privateKey
            })
        }
        return wallets
    }

    static async generateSignature(params: CreateSignatureDto) {
        const symbol = toUpper(trim(params.symbol))
        const message = `${symbol}:${params.sender}:${params.recipient}:${params.amount}:${params.nonce}`
        const signature = await signMessage(params.privateKey, message)
        return { signature }
    }

    static async sendRaw(params: SendRawDto) {
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
        const transferFee = Number(config.system.primeTransferFee)
        if (mode === FeeMode.Inclusive) {
            const sendAmountWithFee = Number(params.amount)
            const amountWithoutFee = sendAmountWithFee - transferFee
            if (amountWithoutFee < 0) {
                throw new BizException(
                    TransactionErrors.send_amount_less_than_fee_error,
                    new ErrorContext('coin.service', 'sendRaw', { sender: params.sender })
                )
            }
        }
        const amount = Number(params.amount)
        const senderBalance = Number(senderWallet.amount)
        // calculate send amount
        const amountToSend = mode === FeeMode.Exclusive ? amount + transferFee : amount
        if (senderBalance < amountToSend) {
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
        const sendData: ISendRawDto = {
            symbol: symbol,
            sender: params.sender,
            recipient: params.recipient,
            amount: String(params.amount),
            nonce: String(params.nonce),
            type: 'TRANSFER',
            signature: params.signature,
            notes: params.notes,
            fee: String(transferFee),
            feeAddress: masterAccount.address,
            mode: mode
        }

        return await PrimeCoinProvider.sendRaw(sendData)
    }

    static async queryPrimeTxns(params: { symbol: string; filter: ITransactionFilter }) {
        return await PrimeCoinProvider.queryPrimeTxns({
            ...params.filter,
            symbol: params.symbol
        })
    }

    static async getAccountBySymbolAndAddress(symbol: string, address: string) {
        return await PrimeCoinProvider.getWalletBySymbolAndAddress(symbol, address)
    }

    static async getTxnByKey(key: string) {
        return await PrimeCoinProvider.getPrimeTxnByKey(key)
    }
}
