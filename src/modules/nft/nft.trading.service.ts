import BizException from '@exceptions/biz.exception'
import { AccountErrors, NftErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import IOptions from '@interfaces/options.interface'
import AccountService from '@modules/account/account.service'
import SettingService from '@modules/setting/setting.service'
import { ISendCoinDto } from '@modules/transaction/transaction.interface'
import { IUser } from '@modules/user/user.interface'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { formatAmount, parsePrimeAmount } from '@utils/number'
import { decryptKeyWithSalt, signMessage } from '@utils/wallet'
import { INft } from './nft.interface'
import AccountSnapshotService from '@modules/account/account.snapshot.service'
import { AccountActionType } from '@config/constants'
import { IOperator } from '@interfaces/operator.interface'

export default class NftTradingService {
    static async allocatePrimeCoins(nft: INft, buyer: IUser, seller: IUser, operator: IOperator, options?: IOptions) {
        const masterAccount = await AccountService.getMasterAccountBriefBySymbol(nft.currency)
        const creatorAccount = await AccountService.getAccountByUserKeyAndSymbol(nft.creator_key, nft.currency)
        const sellerAccount = await AccountService.getAccountByUserKeyAndSymbol(seller.key ?? '', nft.currency)
        const buyerAccount = await AccountService.getAccountByUserKeyAndSymbol(buyer.key ?? '', nft.currency)

        if (!sellerAccount || !buyerAccount || !masterAccount || !creatorAccount) {
            throw new BizException(
                AccountErrors.account_not_exists_error,
                new ErrorContext('NftTrading.service', 'assignPrimeCoins', { key: nft.key })
            )
        }

        const setting = await SettingService.getGlobalSetting()

        const commissionFeeRate = parseFloat(setting.nft_commission_fee_rate.toString())
        const buyerBalance = parsePrimeAmount(Number(buyerAccount.amount) - Number(buyerAccount.amount_locked))
        const paymentOrderValue = parsePrimeAmount(nft.price)
        const commissionFee = parseFloat(nft.price.toString()) * commissionFeeRate
        const commissionFeeAmount = parsePrimeAmount(commissionFee)

        const buyerToMasterAmount = paymentOrderValue

        const royaltyRate = parseFloat((nft.royalty || 0).toString())
        const royaltyFee = parseFloat(nft.price.toString()) * royaltyRate
        const royaltyFeeAmount = parsePrimeAmount(royaltyFee)
        const masterToSellerAmount = buyerToMasterAmount.sub(commissionFeeAmount).sub(royaltyFeeAmount)

        if (buyerBalance.lt(paymentOrderValue)) {
            throw new BizException(
                NftErrors.purchase_insufficient_funds_error,
                new ErrorContext('NftTrading.service', 'assignPrimeCoins', { price: nft.price })
            )
        }
        // const transferFee = Number(setting.prime_transfer_fee || 0)
        const txnDetails = {
            type: 'PRODUCT',
            nft_key: nft.key,
            nft_name: nft.name,
            nft_price: Number(nft.price),
            currency: nft.currency,
            commission_fee: commissionFee,
            seller: seller.key,
            seller_address: sellerAccount.address,
            buyer: buyer.key,
            buyer_address: buyerAccount.address,
            payment_order_value: Number(nft.price),
            payment_symbol: nft.currency
        }

        // 1. buyer send coins to master
        const buyerKeyStore = await AccountService.getAccountKeyStore(buyerAccount.key)
        const buyerPrivateKey = await decryptKeyWithSalt(buyerKeyStore.key_store, buyerKeyStore.salt)
        let buyerNonce = await PrimeCoinProvider.getWalletNonceBySymbolAndAddress(buyerAccount.symbol, buyerAccount.address)
        buyerNonce = buyerNonce + 1
        const buyerSendAmount = formatAmount(buyerToMasterAmount.toString())
        const buyerMessage = `${nft.currency}:${buyerAccount.address}:${masterAccount.address}:${buyerSendAmount}:${buyerNonce}`
        const buyerSignature = await signMessage(buyerPrivateKey, buyerMessage)

        txnDetails.type = 'NFT_BOUGHT'
        const buyerTxnParams: ISendCoinDto = {
            symbol: nft.currency,
            sender: buyerAccount.address,
            recipient: masterAccount.address,
            amount: buyerSendAmount,
            nonce: String(buyerNonce),
            type: 'NFT_BOUGHT',
            signature: buyerSignature,
            notes: `NFT bought - name: ${nft.name}, key: ${nft.key} `,
            details: txnDetails,
            fee_address: masterAccount.address,
            fee: String(0)
        }
        const buyerResponse = await PrimeCoinProvider.sendPrimeCoins(buyerTxnParams)

        if (buyerResponse) {
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: buyerAccount.user_key,
                account_key: buyerAccount.key,
                symbol: buyerAccount.symbol,
                address: buyerAccount.address,
                type: AccountActionType.NftBought,
                amount: buyerResponse.sender_wallet.amount,
                pre_amount: buyerResponse.sender_wallet.pre_balance,
                pre_amount_locked: buyerAccount.amount_locked,
                post_amount: buyerResponse.sender_wallet.post_balance,
                post_amount_locked: buyerAccount.amount_locked,
                txn: buyerResponse.key,
                operator: operator,
                options
            })
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: masterAccount.user_key,
                account_key: masterAccount.key,
                symbol: masterAccount.symbol,
                address: masterAccount.address,
                type: AccountActionType.NftBought,
                amount: buyerResponse.recipient_wallet.amount,
                pre_amount: buyerResponse.recipient_wallet.pre_balance,
                pre_amount_locked: masterAccount.amount_locked,
                post_amount: buyerResponse.recipient_wallet.post_balance,
                post_amount_locked: masterAccount.amount_locked,
                txn: buyerResponse.key,
                operator: operator,
                options
            })
        }

        const buyerTxn = buyerResponse.key

        const masterKeyStore = await AccountService.getAccountKeyStore(masterAccount.key)
        const masterPrivateKey = await decryptKeyWithSalt(masterKeyStore.key_store, masterKeyStore.salt)

        let royaltyTxn
        let masterNonce
        if (royaltyFeeAmount.gt(0)) {
            // 2. master send royalty to creator
            masterNonce = await PrimeCoinProvider.getWalletNonceBySymbolAndAddress(masterAccount.symbol, masterAccount.address)
            masterNonce = masterNonce + 1
            const royaltyMessage = `${nft.currency}:${masterAccount.address}:${creatorAccount.address}:${royaltyFee}:${masterNonce}`
            const royaltySignature = await signMessage(masterPrivateKey, royaltyMessage)

            txnDetails.type = 'NFT_ROYALTY'
            const royaltyTxnParams: ISendCoinDto = {
                symbol: nft.currency,
                sender: masterAccount.address,
                recipient: creatorAccount.address,
                amount: String(royaltyFee),
                nonce: String(masterNonce),
                type: 'NFT_ROYALTY',
                signature: royaltySignature,
                notes: `NFT royalty - name: ${nft.name}, key: ${nft.key} `,
                details: txnDetails,
                fee_address: masterAccount.address,
                fee: String(0)
            }
            const royaltyResponse = await PrimeCoinProvider.sendPrimeCoins(royaltyTxnParams)

            if (royaltyResponse) {
                await AccountSnapshotService.createAccountSnapshot({
                    key: undefined,
                    user_key: masterAccount.user_key,
                    account_key: masterAccount.key,
                    symbol: masterAccount.symbol,
                    address: masterAccount.address,
                    type: AccountActionType.NftRoyalty,
                    amount: royaltyResponse.sender_wallet.amount,
                    pre_amount: royaltyResponse.sender_wallet.pre_balance,
                    pre_amount_locked: masterAccount.amount_locked,
                    post_amount: royaltyResponse.sender_wallet.post_balance,
                    post_amount_locked: masterAccount.amount_locked,
                    txn: royaltyResponse.key,
                    operator: operator,
                    options
                })
                await AccountSnapshotService.createAccountSnapshot({
                    key: undefined,
                    user_key: creatorAccount.user_key,
                    account_key: creatorAccount.key,
                    symbol: creatorAccount.symbol,
                    address: creatorAccount.address,
                    type: AccountActionType.NftRoyalty,
                    amount: royaltyResponse.recipient_wallet.amount,
                    pre_amount: royaltyResponse.recipient_wallet.pre_balance,
                    pre_amount_locked: creatorAccount.amount_locked,
                    post_amount: royaltyResponse.recipient_wallet.post_balance,
                    post_amount_locked: creatorAccount.amount_locked,
                    txn: royaltyResponse.key,
                    operator: operator,
                    options
                })
            }

            royaltyTxn = royaltyResponse.key
        }

        // 3. master send coins to seller

        masterNonce = await PrimeCoinProvider.getWalletNonceBySymbolAndAddress(masterAccount.symbol, masterAccount.address)
        masterNonce = masterNonce + 1
        const sellerAmount = formatAmount(masterToSellerAmount.toString())
        const sellerMessage = `${nft.currency}:${masterAccount.address}:${sellerAccount.address}:${sellerAmount}:${masterNonce}`
        const sellerSignature = await signMessage(masterPrivateKey, sellerMessage)

        txnDetails.type = 'NFT_SOLD'
        const royaltyTxnParams: ISendCoinDto = {
            symbol: nft.currency,
            sender: masterAccount.address,
            recipient: sellerAccount.address,
            amount: sellerAmount,
            nonce: String(masterNonce),
            type: 'NFT_SOLD',
            signature: sellerSignature,
            notes: `NFT Sold - name: ${nft.name}, key: ${nft.key} `,
            details: txnDetails,
            fee_address: masterAccount.address,
            fee: String(0)
        }
        const sellerResponse = await PrimeCoinProvider.sendPrimeCoins(royaltyTxnParams)
        const sellerTxn = sellerResponse.key

        if (sellerResponse) {
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: masterAccount.user_key,
                account_key: masterAccount.key,
                symbol: masterAccount.symbol,
                address: masterAccount.address,
                type: AccountActionType.NftSold,
                amount: sellerResponse.sender_wallet.amount,
                pre_amount: sellerResponse.sender_wallet.pre_balance,
                pre_amount_locked: masterAccount.amount_locked,
                post_amount: sellerResponse.sender_wallet.post_balance,
                post_amount_locked: masterAccount.amount_locked,
                txn: sellerResponse.key,
                operator: operator,
                options
            })
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: sellerAccount.user_key,
                account_key: sellerAccount.key,
                symbol: sellerAccount.symbol,
                address: sellerAccount.address,
                type: AccountActionType.NftSold,
                amount: sellerResponse.recipient_wallet.amount,
                pre_amount: sellerResponse.recipient_wallet.pre_balance,
                pre_amount_locked: sellerAccount.amount_locked,
                post_amount: sellerResponse.recipient_wallet.post_balance,
                post_amount_locked: sellerAccount.amount_locked,
                txn: sellerResponse.key,
                operator: operator,
                options
            })
        }

        return { buyerTxn, sellerTxn, royaltyTxn, commissionFee, royaltyFee, buyerAccount, sellerAccount }
    }
}
