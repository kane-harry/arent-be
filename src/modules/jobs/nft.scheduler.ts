import { INft, ITopBid } from '@modules/nft/nft.interface'
import BizException from '@exceptions/biz.exception'
import { AuthErrors, NftErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import UserService from '@modules/user/user.service'
import { AccountActionType, NftActions, NftOnwerShipType, NftPriceType, NftPurchaseType, NftStatus } from '@config/constants'
import NftHistoryModel from '@modules/nft_history/nft_history.model'
import UserModel from '@modules/user/user.model'
import AccountService from '@modules/account/account.service'
import NftService from '@modules/nft/nft.service'
import { NftModel } from '@modules/nft/nft.model'
import { generateUnixTimestamp } from '@utils/utility'
import IScheduler from '@interfaces/scheduler.interface'
import cron from 'node-cron'
import NftTradingService from '@modules/nft/nft.trading.service'
import AccountSnapshotService from '@modules/account/account.snapshot.service'

export default class NftScheduler implements IScheduler {
    constructor() {
        this.handleEndAuctions()
    }

    private async handleEndAuctions() {
        const task = cron.schedule('*/2 * * * *', async () => {
            const timestamp = generateUnixTimestamp() - 60
            const nfts = await NftModel.find(
                { price_type: NftPriceType.Auction, status: NftStatus.Approved, on_market: true, auction_end: { $lte: timestamp } },
                { _id: 0 }
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
            const seller = await UserService.getBriefByKey(nft.owner_key, true)
            const buyer = await UserService.getBriefByKey(topBid.user_key, true)

            if (!seller || !buyer) {
                throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('nft.service', 'buyNft', { key: nft.key }))
            }

            const operator = { key: 'scheduler', role: 999 }
            const options = { agent: 'Node', ip: '127.0.0.1' }
            let { buyerTxn, sellerTxn, royaltyTxn, commissionFee, royaltyFee, buyerAccount } = await NftTradingService.allocatePrimeCoins(
                nft,
                buyer,
                seller,
                operator,
                options
            )

            const preBuyerLockedAmount = buyerAccount.amount_locked
            buyerAccount = await AccountService.unlockAmount(buyerAccount.key, topBid.price)
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: buyerAccount.user_key,
                account_key: buyerAccount.key,
                symbol: buyerAccount.symbol,
                address: buyerAccount.address,
                type: AccountActionType.NftBid,
                amount: Number(topBid.price),
                pre_amount: buyerAccount.amount,
                pre_amount_locked: preBuyerLockedAmount,
                post_amount: buyerAccount.amount,
                post_amount_locked: buyerAccount.amount_locked,
                note: `Bid Success - item: ${nft.key} , unlock amount: ${topBid.price}`,
                operator: operator,
                options
            })

            const last_purchase = {
                user_key: buyer.key,
                avatar: buyer.avatar,
                chat_name: buyer.chat_name,
                price: nft.price,
                secondary_market: nft.creator_key !== nft.owner_key,
                currency: nft.currency,
                txn: buyerTxn,
                type: NftPurchaseType.Auction,
                date: new Date()
            }

            const updateData: any = { owner_key: buyer.key, on_market: false, last_purchase }

            const data = await NftModel.findOneAndUpdate(
                { key: nft.key },
                {
                    $set: updateData
                },
                { new: true }
            )

            await new NftHistoryModel({
                key: undefined,
                nft_key: nft.key,
                operator,
                action: NftActions.Purchase,
                options,
                pre_data: nft.toString(),
                post_data: data?.toString()
            }).save()

            await NftService.addNftSaleLog({
                key: undefined,
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
                details: { buyer_txn: buyerTxn, seller_txn: sellerTxn, royalty_txn: royaltyTxn }
            })
            await NftService.addNftOwnershipLog({
                key: undefined,
                nft_key: nft.key,
                collection_key: nft.collection_key,
                price: nft.price,
                currency: nft.currency,
                token_id: nft.token_id,
                previous_owner: { key: seller.key, avatar: seller.avatar, chat_name: seller.chat_name },
                current_owner: { key: buyer.key, avatar: buyer.avatar, chat_name: buyer.chat_name },
                type: NftOnwerShipType.Purchase
            })
            await NftService.sendNftPurchaseEmailNotification({ buyer, seller, nft, buyerTxn, royaltyTxn, sellerTxn })

            session.endSession()
            return { buyer_txn: buyerTxn, seller_txn: sellerTxn, royalty_txn: royaltyTxn }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }
}
