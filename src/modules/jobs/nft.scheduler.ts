import { INft, ITopBid } from '@modules/nft/nft.interface'
import BizException from '@exceptions/biz.exception'
import { AccountErrors, AuthErrors, NftErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import UserService from '@modules/user/user.service'
import { NftHistoryActions, NftOnwerShipType, NftPriceType, NftStatus } from '@config/constants'
import NftHistoryModel from '@modules/nft_history/nft_history.model'
import UserModel from '@modules/user/user.model'
import AccountService from '@modules/account/account.service'
import { IAccount } from '@modules/account/account.interface'
import SettingService from '@modules/setting/setting.service'
import { formatAmount, parsePrimeAmount } from '@utils/number'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { ISendCoinDto } from '@modules/transaction/transaction.interface'
import { decryptKeyWithSalt, signMessage } from '@utils/wallet'
import NftService from '@modules/nft/nft.service'
import { NftModel } from '@modules/nft/nft.model'
import { generateUnixTimestamp } from '@utils/utility'
import IScheduler from '@interfaces/scheduler.interface'
import cron from 'node-cron'

export default class NftScheduler implements IScheduler {
    constructor() {
        this.handleEndAuctions()
    }

    private async handleEndAuctions() {
        const task = cron.schedule('* * * * *', async () => {
            const timestamp = generateUnixTimestamp() - 60
            const nfts = await NftModel.find(
                { price_type: NftPriceType.Auction, status: NftStatus.Approved, on_market: true, auction_end: { $lte: timestamp } },
                { projection: { _id: 0 } }
            )
                .sort({ auction_end: 1 })
                .limit(100)
            for (let i = 0; i < nfts.length; i++) {
                await NftScheduler.checkWinnerBidNft(nfts[i])
            }
        })
        task.start()
    }

    static async checkWinnerBidNft(nft: INft) {
        const session = await UserModel.startSession()
        session.startTransaction()
        try {
            if (!nft.on_market) {
                throw new BizException(NftErrors.item_not_on_market, new ErrorContext('nft.service', 'buyNft', { key: nft.key }))
            }
            if (nft.price_type !== NftPriceType.Auction) {
                throw new BizException(NftErrors.purchase_auction_nft_error, new ErrorContext('nft.service', 'buyNft', { key: nft.key }))
            }
            if (!nft.top_bid) {
                return
            }
            const topBid: ITopBid = nft.top_bid
            const seller = await UserService.getBriefByKey(nft.owner_key)
            const buyer = await UserService.getBriefByKey(topBid.user_key)

            if (!seller || !buyer) {
                throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('nft.service', 'buyNft', { key: nft.key }))
            }

            const masterAccount: IAccount | null = await AccountService.getMasterAccountBriefBySymbol(nft.currency)
            const creatorAccount: IAccount | null = await AccountService.getAccountByUserKeyAndSymbol(nft.creator_key, nft.currency)
            const sellerAccount: IAccount | null = await AccountService.getAccountByUserKeyAndSymbol(seller.key, nft.currency)
            const buyerAccount: IAccount | null = await AccountService.getAccountByUserKeyAndSymbol(buyer.key, nft.currency)

            if (!sellerAccount || !buyerAccount || !masterAccount || !creatorAccount) {
                throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('nft.service', 'buyNft', { key: nft.key }))
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
                throw new BizException(NftErrors.purchase_insufficient_funds_error, new ErrorContext('nft.service', 'buyNft', { price: nft.price }))
            }
            await AccountService.unlockAmount(buyerAccount.key, topBid.price, buyer)
            // const transferFee = Number(setting.prime_transfer_fee || 0)
            const txnDetails = {
                type: 'PRODUCT',
                nft_key: nft.key,
                nft_name: nft.name,
                nft_price: nft.price,
                currency: nft.currency,
                commission_fee: commissionFee,
                seller: seller.key,
                seller_address: sellerAccount.address,
                buyer: buyer.key,
                buyer_address: buyerAccount.address,
                payment_order_value: nft.price,
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
                type: 'TRANSFER',
                signature: buyerSignature,
                notes: `NFT bought - name: ${nft.name}, key: ${nft.key} `,
                details: txnDetails,
                fee_address: masterAccount.address,
                fee: String(0)
            }
            const buyerResponse = await PrimeCoinProvider.sendPrimeCoins(buyerTxnParams)

            const buyer_txn = buyerResponse.key

            const masterKeyStore = await AccountService.getAccountKeyStore(masterAccount.key)
            const masterPrivateKey = await decryptKeyWithSalt(masterKeyStore.key_store, masterKeyStore.salt)

            let royalty_txn
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
                    type: 'TRANSFER',
                    signature: royaltySignature,
                    notes: `NFT royalty - name: ${nft.name}, key: ${nft.key} `,
                    details: txnDetails,
                    fee_address: masterAccount.address,
                    fee: String(0)
                }
                const royaltyResponse = await PrimeCoinProvider.sendPrimeCoins(royaltyTxnParams)
                royalty_txn = royaltyResponse.key
            }

            // 3. master send coins to seller

            masterNonce = await PrimeCoinProvider.getWalletNonceBySymbolAndAddress(masterAccount.symbol, masterAccount.address)
            masterNonce = masterNonce + 1
            const sellerAmount = formatAmount(masterToSellerAmount.toString())
            const sellerMessage = `${nft.currency}:${masterAccount.address}:${sellerAccount.address}:${sellerAmount}:${masterNonce}`
            const sellerSignature = await signMessage(masterPrivateKey, sellerMessage)

            txnDetails.type = 'ITEM_SOLD'
            const royaltyTxnParams: ISendCoinDto = {
                symbol: nft.currency,
                sender: masterAccount.address,
                recipient: sellerAccount.address,
                amount: sellerAmount,
                nonce: String(masterNonce),
                type: 'TRANSFER',
                signature: sellerSignature,
                notes: `NFT Sold - name: ${nft.name}, key: ${nft.key} `,
                details: txnDetails,
                fee_address: masterAccount.address,
                fee: String(0)
            }
            const sellerResponse = await PrimeCoinProvider.sendPrimeCoins(royaltyTxnParams)
            const seller_txn = sellerResponse.key

            const updateData: any = { owner_key: buyer.key, on_market: false }

            const data = await NftModel.findOneAndUpdate(
                { key: nft.key },
                {
                    $set: updateData
                },
                { projection: { _id: 0 }, returnOriginal: false }
            )

            await new NftHistoryModel({
                nft_key: nft.key,
                user_key: buyer.key,
                action: NftHistoryActions.Purchase,
                agent: '',
                country: buyer.country,
                ip_address: '',
                pre_data: nft.toString(),
                post_data: data?.toString()
            }).save()

            await NftService.addNftSaleLog({
                nft_key: nft.key,
                collection_key: nft.collection_key,
                unit_price: nft.price,
                currency: nft.currency,
                order_value: nft.price,
                commission_fee: commissionFee,
                royalty_fee: royaltyFee,
                quantity: 1,
                seller: { key: seller.key, avatar: seller.avatar, chat_name: seller.chat_name },
                buyer: { key: buyer.key, avatar: buyer.avatar, chat_name: buyer.chat_name },
                secondary_market: nft.creator_key !== nft.owner_key,
                details: { buyer_txn, seller_txn, royalty_txn }
            })
            await NftService.addNftOwnershipLog({
                nft_key: nft.key,
                collection_key: nft.collection_key,
                price: nft.price,
                currency: nft.currency,
                token_id: nft.token_id,
                previous_owner: { key: seller.key, avatar: seller.avatar, chat_name: seller.chat_name },
                current_owner: { key: buyer.key, avatar: buyer.avatar, chat_name: buyer.chat_name },
                type: NftOnwerShipType.Purchase
            })
            await NftService.sendNftPurchaseEmailNotification({ buyer, seller, nft, buyer_txn, royalty_txn, seller_txn })

            session.endSession()
            return { buyer_txn, royalty_txn, seller_txn }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }
}
