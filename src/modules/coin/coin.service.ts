import BizException from '../../exceptions/biz.exception'
import ErrorContext from '../../exceptions/error.context'
import { CreateRawWalletDto, CreateSignatureDto, SendRawDto } from './coin.dto'
import { trim, toUpper } from 'lodash'
import { TransactionErrors } from '../../exceptions/custom.error'
import { createEtherWallet, signMessage } from '../../utils/wallet'
import { createCoinWallet, getWalletBySymbolAndAddress, sendRaw } from '../../providers/coin.provider'

export default class CoinService {
    static async createRawWallet(params: CreateRawWalletDto) {
        const etherWallet = await createEtherWallet()
        const coinWallets = await createCoinWallet(params.symbol, etherWallet.address, true)
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
        const message = `${symbol}:${params.sender}:${params.recipient}:${params.amount}:${params.nonce}:${params.notes}`
        const signature = await signMessage(params.privateKey, message)
        return { signature }
    }

    static async sendRaw(params: SendRawDto) {
        // TODO: check account owner = operator
        params.symbol = toUpper(trim(params.symbol))
        const sendAmount = Number(params.amount)
        const senderWallet = await getWalletBySymbolAndAddress(params.symbol, params.sender)
        const recipientWallet = await getWalletBySymbolAndAddress(params.symbol, params.recipient)
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
        const senderBalance = Number(senderWallet.amount)
        if (senderBalance < sendAmount) {
            throw new BizException(
                TransactionErrors.sender_insufficient_balance_error,
                new ErrorContext('coin.service', 'sendRaw', { sender: params.sender, balance: senderWallet.amount, sendAmount })
            )
        }
        const data = await sendRaw(params)
        return data
    }
}
