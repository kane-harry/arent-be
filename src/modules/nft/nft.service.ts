import {
    BidNftDto,
    CreateNftDto,
    ImportNftDto,
    MakeOfferDto,
    NftOnMarketDto,
    UpdateNftDto,
    UpdateNftFeaturedDto,
    UpdateNftStatusDto
} from './nft.dto'
import { NftBidLogModel, NftImportLogModel, NftModel, NftOfferModel, NftOwnershipLogModel, NftSaleLogModel } from './nft.model'
import { CollectionModel } from '@modules/collection/collection.model'
import { QueryRO } from '@interfaces/query.model'
import { INft, INftBidLog, INftFilter, INftOffer, INftOwnershipLog, INftSaleLog } from '@modules/nft/nft.interface'
import BizException from '@exceptions/biz.exception'
import { AccountErrors, AuthErrors, CollectionErrors, CommonErrors, NftErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { isAdmin, roleCan } from '@config/role'
import UserService from '@modules/user/user.service'
import {
    NFT_IMAGE_SIZES,
    NftActions,
    NftOnwerShipType,
    NftPriceType,
    NftStatus,
    OfferStatusType,
    AccountActionType,
    NftPurchaseType,
    NftType
} from '@config/constants'
import NftHistoryModel from '@modules/nft_history/nft_history.model'
import CollectionService from '@modules/collection/collection.service'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { filter } from 'lodash'
import UserModel from '@modules/user/user.model'
import AccountService from '@modules/account/account.service'
import { config } from '@config'
import { addToAcceptOfferQueue, addToBuyProductQueue } from '@modules/queues/nft_queue'
import { generateUnixTimestamp } from '@utils/utility'
import { parsePrimeAmount } from '@utils/number'
import EmailService from '@modules/emaill/email.service'
import IOptions from '@interfaces/options.interface'
import NftTradingService from './nft.trading.service'
import AccountSnapshotService from '@modules/account/account.snapshot.service'
import { IOperator } from '@interfaces/operator.interface'
import moment from 'moment'
import NftHelper from './nft.helper'
import { uploadIpfs } from '@utils/ipfsUpload'

export default class NftService {
    static async importNft(payload: ImportNftDto, operator: IOperator) {
        const model = new NftImportLogModel({
            ...payload,
            creator: operator.key
        })
        return await model.save()
    }

    static async createNft(params: CreateNftDto, files: any, operator: IOperator, options: IOptions) {
        let nftType = NftType.ERC721
        if (params.type) {
            if (params.type.toUpperCase() === NftType.ERC1155) {
                nftType = NftType.ERC1155
            }
        }
        const user = await UserService.getBriefByKey(operator.key)
        if (!files || !files.find((item: any) => item.fieldname === 'image')) {
            throw new BizException(NftErrors.nft_image_required_error, new ErrorContext('nft.service', 'createNft', {}))
        }
        files = await resizeImages(files, { image: NFT_IMAGE_SIZES })
        const assets = await uploadFiles(files, 'nfts')

        const images = filter(assets, asset => {
            return asset.fieldname === 'image'
        })
        const originalImg = images.find(item => item.type === 'original')
        const largeImg = images.find(item => item.type === 'large')
        const normalImg = images.find(item => item.type === 'normal')
        const smallImg = images.find(item => item.type === 'small')
        const image = {
            original: originalImg?.key,
            large: largeImg?.key,
            normal: normalImg?.key,
            small: smallImg?.key
        }
        const animationResp = assets.find(asset => {
            return asset.fieldname === 'animation'
        })
        const animation = animationResp?.key

        if (!params.collection_key) {
            const collection = await CollectionService.createDefaultCollection(params, operator)
            params.collection_key = collection?.key ?? ''
        } else {
            const collection = await CollectionModel.findOne({ key: params.collection_key })
            if (!collection) {
                throw new BizException(
                    CollectionErrors.collection_not_exists_error,
                    new ErrorContext('nft.service', 'createNft', { key: params.collection_key })
                )
            }
        }
        if (!params.currency) {
            params.currency = config.system.primeToken
        }
        const model = new NftModel({
            key: undefined,
            ...params,
            type: nftType,
            token_id: String(moment().unix()),
            platform: config.system.nftDefaultPlatform,
            currency: params.currency ?? config.system.primeToken,
            image: image,
            animation: animation,
            status: isAdmin(operator.role) ? NftStatus.Approved : NftStatus.Pending,
            reviewer_key: isAdmin(operator.role) ? operator.key : undefined,
            creator_key: operator.key,
            owner_key: operator.key,
            on_market: false,
            number_of_likes: 0
        })
        const nft = await model.save()
        await CollectionModel.findOneAndUpdate({ key: nft.collection_key }, { $inc: { items_count: 1 } }, { new: true }).exec()
        // create log
        await new NftHistoryModel({
            key: undefined,
            nft_key: nft.key,
            operator: operator,
            action: NftActions.Create,
            options: options,
            pre_data: null,
            post_data: nft.toJSON()
        }).save()

        await NftService.addNftOwnershipLog({
            key: undefined,
            nft_key: nft.key,
            collection_key: nft.collection_key,
            price: nft.price,
            currency: nft.currency,
            token_id: nft.token_id,
            previous_owner: { key: user.key, avatar: user.avatar, chat_name: user.chat_name },
            current_owner: { key: user.key, avatar: user.avatar, chat_name: user.chat_name },
            type: NftOnwerShipType.Mint
        })

        return NftHelper.formatNftRO(nft)
    }

    static async queryNfts(params: INftFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = { $and: [{ removed: false }] }
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms, 'i')
            filter.$or = [{ key: reg }, { name: reg }, { description: reg }, { type: reg }, { status: reg }]
        }
        if (params.owner_key) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ owner_key: { $eq: params.owner_key } })
        }
        if (params.price_min) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ price: { $gte: params.price_min } })
        }
        if (params.price_max) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ price: { $lte: params.price_max } })
        }
        if (params.collection_key) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ collection_key: { $eq: params.collection_key } })
        }
        if (params.on_market) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ on_market: { $eq: params.on_market } })
        }
        if (params.featured) {
            filter.$and = filter.$and ?? []
            filter.$and.push({ featured: { $eq: params.featured } })
        }
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await NftModel.countDocuments(filter)
        const nfts = await NftModel.find<INft>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()

        const items = await NftHelper.formatNftListRO(nfts)
        return new QueryRO(totalCount, params.page_index, params.page_size, items)
    }

    static async updateNft(key: string, params: UpdateNftDto, files: any, operator: IOperator, options: IOptions) {
        const nft = await NftModel.findOne({ key, removed: false })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'updateNft', { key }))
        }
        if (!roleCan(operator.role || 0, config.operations.UPDATE_NFT_DETAILS) && nft.status === NftStatus.Approved) {
            throw new BizException(NftErrors.nft_updation_status_error, new ErrorContext('nft.service', 'updateNft', { key }))
        }
        const preNft = nft
        if (files) {
            files = await resizeImages(files, { image: NFT_IMAGE_SIZES })
            const assets = await uploadFiles(files, 'nfts')

            const images = filter(assets, asset => {
                return asset.fieldname === 'image'
            })
            const originalImg = images.find(item => item.type === 'original')
            const largeImg = images.find(item => item.type === 'large')
            const normalImg = images.find(item => item.type === 'normal')
            const smallImg = images.find(item => item.type === 'small')
            const image = {
                original: originalImg?.key,
                large: largeImg?.key,
                normal: normalImg?.key,
                small: smallImg?.key
            }
            const animationResp = assets.find(asset => {
                return asset.fieldname === 'animation'
            })
            const animation = animationResp?.key
            nft.set('image', image)
            nft.set('animation', animation)
        }

        nft.set('name', params.name, String)
        nft.set('description', params.description, String)
        nft.set('tags', params.tags, String)
        nft.set('price', params.price, Number)
        nft.set('royalty', params.royalty ?? nft.royalty, Number)
        nft.set('attributes', params.attributes, Array)
        nft.set('meta_data', params.meta_data, Array)
        nft.set('collection_key', params.collection_key ?? nft.collection_key, String)
        nft.set('quantity', params.quantity ?? nft.quantity, Number)

        const updatedNft = await nft.save()

        // create log
        await new NftHistoryModel({
            key: undefined,
            nft_key: key,
            operator: operator,
            action: NftActions.Update,
            options: options,
            pre_data: preNft.toJSON(),
            post_data: updatedNft.toJSON()
        }).save()

        return NftHelper.formatNftRO(updatedNft)
    }

    static async updateNftStatus(key: string, updateNftStatusDto: UpdateNftStatusDto, operator: IOperator, options: IOptions) {
        const nft = await NftModel.findOne({ key, removed: false })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'updateNftStatus', { key }))
        }
        const preNft = nft
        nft.set('status', updateNftStatusDto.status, String)
        nft.set('reviewer_key', operator.key, String)
        const updatedNft = await nft.save()

        // create log
        await new NftHistoryModel({
            key: undefined,
            nft_key: key,
            action: NftActions.UpdateStatus,
            operator: operator,
            options: options,
            pre_data: { status: preNft.status },
            post_data: { status: updatedNft.status }
        }).save()

        return NftHelper.formatNftRO(updatedNft)
    }

    static async deleteNft(key: string, operator: IOperator, options: IOptions) {
        const nft = await NftModel.findOne({ key, removed: false })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.controller', 'deleteNft', { key }))
        }
        if (!isAdmin(operator?.role) && operator.key !== nft.owner_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('nft.controller', 'deleteNft', { key }))
        }
        const preNft = nft
        nft.set('owner_key', '00000000000000000000000000000000', String)
        nft.set('reviewer_key', operator.key, String)
        nft.set('removed', true, Boolean)
        const updateNft = await nft.save()

        await CollectionModel.findOneAndUpdate({ key: nft.collection_key }, { $inc: { items_count: -1 } }, { new: true }).exec()
        // create log
        await new NftHistoryModel({
            key: undefined,
            nft_key: key,
            action: NftActions.Delete,
            operator: operator,
            options: options,
            pre_data: preNft.toJSON(),
            post_data: updateNft.toJSON()
        }).save()

        return { success: true }
    }

    static async getNftDetail(key: string, userKey?: string) {
        const nft = await NftModel.findOne({ key, removed: false }).exec()
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.controller', 'getNFTDetail', { key }))
        }
        return NftHelper.formatNftRO(nft, userKey)
    }

    static async onMarket(key: string, params: NftOnMarketDto, operator: IOperator, options: IOptions) {
        const nft = await NftModel.findOne({ key, removed: false })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        if (!roleCan(operator.role || 0, config.operations.PUT_NFT_ON_MARKET) && nft.owner_key !== operator.key) {
            throw new BizException(CommonErrors.unauthorised, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        if (nft.status !== NftStatus.Approved) {
            throw new BizException(NftErrors.nft_is_not_approved_error, new ErrorContext('nft.service', 'onMarket', { key }))
        }

        if (params.price_type === NftPriceType.Auction) {
            if (params.auction_start > params.auction_end) {
                throw new BizException(
                    NftErrors.nft_auction_start_time_less_than_end_time_error,
                    new ErrorContext('nft.service', 'onMarket', { key, auction_start: params.auction_start })
                )
            }
            const auction_end = Number(params.auction_end)
            const auction_start = Number(params.auction_start)
            const currentTime = generateUnixTimestamp()
            if (auction_end > 0 && auction_end < currentTime) {
                throw new BizException(
                    NftErrors.nft_auction_end_time_less_than_current_time_error,
                    new ErrorContext('nft.service', 'onMarket', { key, auction_end: params.auction_end })
                )
            }
            nft.set('auction_start', auction_start)
            nft.set('auction_end', auction_end)
        }
        if (params.price) {
            nft.set('price', params.price)
        }
        nft.set('price_type', params.price_type)
        nft.set('on_market', true)
        nft.set('listing_date', new Date())

        const postData = await nft.save()
        await new NftHistoryModel({
            key: undefined,
            nft_key: key,
            action: NftActions.OnMarket,
            operator: operator,
            options: options,
            pre_data: nft.toJSON(),
            post_data: postData?.toJSON()
        }).save()

        return NftHelper.formatNftRO(postData)
    }

    static async offMarket(key: string, operator: IOperator, options: IOptions) {
        const nft = await NftModel.findOne({ key, removed: false })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        if (!roleCan(operator.role || 0, config.operations.PUT_NFT_OFF_MARKET) && nft.owner_key !== operator.key) {
            throw new BizException(CommonErrors.unauthorised, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        if (nft.status !== NftStatus.Approved) {
            throw new BizException(NftErrors.nft_is_not_approved_error, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        nft.set('on_market', false)

        const postData = await nft.save()
        await new NftHistoryModel({
            key: undefined,
            nft_key: key,
            action: NftActions.OffMarket,
            operator: operator,
            options: options,
            pre_data: nft.toJSON(),
            post_data: postData?.toJSON()
        }).save()

        return NftHelper.formatNftRO(postData)
    }

    static async processPurchase(key: string, operator: IOperator, options: IOptions) {
        let data = null
        if (config.redis.enabled) {
            data = await addToBuyProductQueue({ key, operator, options })
        } else {
            data = await NftService.buyNft(key, operator, options)
        }
        return data
    }

    static async buyNft(key: string, operator: IOperator, options: IOptions) {
        const session = await UserModel.startSession()
        session.startTransaction()
        try {
            const nft = await NftModel.findOne({ key, removed: false }).exec()
            if (!nft) {
                throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'buyNft', { key }))
            }
            if (nft.owner_key === operator.key) {
                throw new BizException(
                    NftErrors.product_buy_same_owner_error,
                    new ErrorContext('nft.service', 'buyNft', { key, owner_key: nft.owner_key })
                )
            }
            if (!nft.on_market) {
                throw new BizException(NftErrors.item_not_on_market, new ErrorContext('nft.service', 'buyNft', { key }))
            }

            if (nft.price_type !== NftPriceType.Fixed) {
                throw new BizException(NftErrors.purchase_auction_nft_error, new ErrorContext('nft.service', 'buyNft', { key }))
            }
            const creator = await UserService.getBriefByKey(nft.creator_key, true)
            const seller = await UserService.getBriefByKey(nft.owner_key, true)
            const buyer = await UserService.getBriefByKey(operator.key, true)

            if (!seller || !seller.key || !buyer || !seller.key) {
                throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('nft.service', 'buyNft', { key }))
            }

            const { buyerTxn, sellerTxn, royaltyTxn, commissionFee, royaltyFee } = await NftTradingService.allocatePrimeCoins(
                nft,
                buyer,
                seller,
                operator,
                options
            )
            const last_purchase = {
                user_key: buyer.key,
                avatar: buyer.avatar,
                chat_name: buyer.chat_name,
                price: nft.price,
                secondary_market: nft.creator_key !== nft.owner_key,
                currency: nft.currency,
                txn: buyerTxn,
                type: NftPurchaseType.Normal,
                date: new Date()
            }
            const updateData: any = { owner_key: buyer.key, on_market: false, last_sale_date: new Date(), last_purchase }

            const data = await NftModel.findOneAndUpdate(
                { key: key },
                {
                    $set: updateData
                },
                { new: true }
            )

            await new NftHistoryModel({
                key: undefined,
                nft_key: key,
                operator: operator,
                action: NftActions.Purchase,
                options: options,
                pre_data: nft.toJSON(),
                post_data: data?.toJSON()
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
                creator: { key: creator.key, avatar: creator.avatar, chat_name: creator.chat_name },
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
            await NftService.sendNftPurchaseEmailNotification({ buyer, seller, nft, buyerTxn, sellerTxn, royaltyTxn })

            session.endSession()
            return { buyer_txn: buyerTxn, seller_txn: sellerTxn, royalty_txn: royaltyTxn }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }

    static async bidNft(key: string, params: BidNftDto, operator: IOperator, options: IOptions) {
        const session = await UserModel.startSession()
        session.startTransaction()
        try {
            const nft = await NftModel.findOne({ key, removed: false }).exec()
            if (!nft) {
                throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'bidNft', { key }))
            }
            if (nft.owner_key === operator.key) {
                throw new BizException(
                    NftErrors.product_buy_same_owner_error,
                    new ErrorContext('nft.service', 'bidNft', { key, owner_key: nft.owner_key })
                )
            }
            if (!nft.on_market) {
                throw new BizException(NftErrors.item_not_on_market, new ErrorContext('nft.service', 'bidNft', { key }))
            }

            if (nft.price_type !== NftPriceType.Auction) {
                throw new BizException(NftErrors.purchase_auction_nft_error, new ErrorContext('nft.service', 'bidNft', { key }))
            }

            const currentTimestamp = generateUnixTimestamp()
            if (!nft.auction_end || currentTimestamp > nft.auction_end) {
                throw new BizException(NftErrors.nft_auction_closed_error, new ErrorContext('nft.service', 'bidNft', { key }))
            }

            if (Number(params.amount) < nft.price) {
                throw new BizException(NftErrors.nft_bidding_amount_less_than_price_error, new ErrorContext('nft.service', 'bidNft', { key }))
            }

            const seller = await UserService.getBriefByKey(nft.owner_key, true)
            const buyer = await UserService.getBriefByKey(operator.key, true)

            if (!seller || !seller.key || !buyer || !buyer.key) {
                throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('nft.service', 'bidNft', { key }))
            }

            let buyerAccount = await AccountService.getAccountByUserKeyAndSymbol(buyer.key, nft.currency)

            if (!buyerAccount) {
                throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('nft.service', 'bidNft', { key }))
            }

            const buyerBalance = parsePrimeAmount(Number(buyerAccount.amount) - Number(buyerAccount.amount_locked))
            const paymentOrderValue = parsePrimeAmount(nft.price)

            if (buyerBalance.lt(paymentOrderValue)) {
                throw new BizException(NftErrors.purchase_insufficient_funds_error, new ErrorContext('nft.service', 'bidNft', { price: nft.price }))
            }

            if (nft.top_bid) {
                if (nft.top_bid.user_key === buyer.key) {
                    throw new BizException(NftErrors.nft_auction_highest_price_error, new ErrorContext('nft.service', 'bidNft', { price: nft.price }))
                }

                // unlock last bidder's amount
                const preBuyerKey = nft.top_bid.user_key
                const preCurrency = nft.top_bid.currency
                const preBidPrice = nft.top_bid.price
                let preBuyerAccount = await AccountService.getAccountByUserKeyAndSymbol(preBuyerKey, preCurrency)
                const preBuyerLockedAmount = preBuyerAccount.amount_locked

                preBuyerAccount = await AccountService.unlockAmount(preBuyerAccount.key, preBidPrice)

                await AccountSnapshotService.createAccountSnapshot({
                    key: undefined,
                    user_key: preBuyerAccount.user_key,
                    account_key: preBuyerAccount.key,
                    symbol: preBuyerAccount.symbol,
                    address: preBuyerAccount.address,
                    type: AccountActionType.NftOutBid,
                    amount: Number(preBidPrice),
                    pre_amount: preBuyerAccount.amount,
                    pre_amount_locked: preBuyerLockedAmount,
                    post_amount: preBuyerAccount.amount,
                    post_amount_locked: preBuyerAccount.amount_locked,
                    operator: operator,
                    note: `Out Bid - item: ${nft.key}, unlock amount: ${nft.top_bid.price}`,
                    options
                })

                // send notifications ， check out in xcur
                const lastBid = await NftService.getLastBidByNftAndUser(preBuyerKey, nft.key)
                // @ts-ignore
                if (!lastBid || currentTimestamp - 60 > lastBid.created.getTime() / 1000) {
                    const preBuyer = await UserModel.findOne({ key: preBuyerKey, removed: false })
                    if (preBuyer) {
                        if (preBuyer.email) {
                            EmailService.sendOutbidNotification({ address: preBuyer.email, nft })
                        }
                        // TODO: App notification
                        // if (preBuyer.phone) {
                        //     sendSms('Out Bid', 'You have been out bid by another user.', preBuyer.phone)
                        // }
                    }
                }
            }

            const topBid = {
                user_key: buyer.key,
                avatar: buyer.avatar,
                chat_name: buyer.chat_name,
                price: parseFloat(params.amount),
                secondary_market: nft.creator_key !== nft.owner_key,
                currency: nft.currency,
                address: buyerAccount.address
            }

            nft.set('top_bid', topBid, Object) // update top bid
            nft.set('price', params.amount, Number) // update nft price

            // extend auction
            if (nft.auction_end - currentTimestamp <= 5 * 60) {
                const extend_seconds = 5 * 60
                const endTimestamp = nft.auction_end + extend_seconds
                nft.set('auction_end', endTimestamp, Number)
            }

            await nft.save()
            buyerAccount = await AccountService.lockAmount(buyerAccount.key, params.amount)
            const preBuyerLockedAmount = buyerAccount.amount_locked
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: buyerAccount.user_key,
                account_key: buyerAccount.key,
                symbol: buyerAccount.symbol,
                address: buyerAccount.address,
                type: AccountActionType.NftOutBid,
                amount: Number(params.amount),
                pre_amount: buyerAccount.amount,
                pre_amount_locked: preBuyerLockedAmount,
                post_amount: buyerAccount.amount,
                post_amount_locked: buyerAccount.amount_locked,
                note: `Bid - item: ${nft.key} , lock amount: ${params.amount}`,
                operator: operator,
                options
            })

            await NftService.addNftBidLog({
                key: undefined,
                nft_key: nft.key,
                collection_key: nft.collection_key,
                price: Number(params.amount),
                currency: nft.currency,
                user: {
                    key: buyer.key,
                    chat_name: buyer.chat_name,
                    avatar: buyer.avatar
                },
                secondary_market: nft.creator_key !== nft.owner_key
            })

            session.endSession()
            return NftHelper.formatNftRO(nft)
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }

    static async addNftSaleLog(params: INftSaleLog) {
        const model = new NftSaleLogModel({
            ...params
        })
        return await model.save()
    }

    static async addNftBidLog(params: INftBidLog) {
        const model = new NftBidLogModel({
            ...params
        })
        return await model.save()
    }

    static async addNftOwnershipLog(params: INftOwnershipLog) {
        const model = new NftOwnershipLogModel({
            ...params
        })
        return await model.save()
    }

    static async sendNftPurchaseEmailNotification(options: any) {
        const { buyer, seller, nft, buyerTxn, royaltyTxn, sellerTxn } = options
        if (buyer.email) {
            const context = { address: buyer.email, txn: buyerTxn }
            EmailService.sendPurchaseProductSuccessNotification(context)
        }
        if (seller.email) {
            const context = { address: seller.email, txn: sellerTxn }
            EmailService.sendSaleProductSuccessNotification(context)
        }
    }

    static async getLastBidByNftAndUser(user_key: string, nft_key: any) {
        const data = await NftBidLogModel.find({ user_key, nft_key }, { _id: 0 }).sort({ created_at: -1 })
        if (data && data.length > 0) {
            return data[0]
        }
        return null
    }

    static async getNftBids(nft_key: string) {
        const bids = await NftBidLogModel.find({ nft_key }, { _id: 0 }).sort({ _id: -1 })
        return bids
    }

    static async getOffers(nft_key: string) {
        const bids = await NftOfferModel.find({ nft_key }, { _id: 0 }).sort({ _id: -1 })
        return bids
    }

    static async makeOffer(key: string, params: MakeOfferDto, operator: IOperator, options: IOptions) {
        const session = await UserModel.startSession()
        session.startTransaction()
        try {
            const nft = await NftModel.findOne({ key, removed: false }).exec()
            if (!nft) {
                throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'makeOffer', { key }))
            }
            if (nft.owner_key === operator.key) {
                throw new BizException(NftErrors.offer_owner_error, new ErrorContext('nft.service', 'makeOffer', { key, owner_key: nft.owner_key }))
            }

            if (nft.price_type !== NftPriceType.Fixed) {
                throw new BizException(NftErrors.offer_auction_nft_error, new ErrorContext('nft.service', 'makeOffer', { key }))
            }

            const pendingOffer = await NftOfferModel.findOne({
                user_key: operator.key,
                nft_key: nft.key,
                removed: false,
                status: OfferStatusType.Pending
            })
            if (pendingOffer) {
                throw new BizException(NftErrors.offer_duplicate_request_error, new ErrorContext('nft.service', 'makeOffer', { key }))
            }

            const seller = await UserService.getBriefByKey(nft.owner_key, true)
            const buyer = await UserService.getBriefByKey(operator.key, true)

            if (!seller || !seller.key || !buyer || !buyer.key) {
                throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('nft.service', 'makeOffer', { key }))
            }

            let buyerAccount = await AccountService.getAccountByUserKeyAndSymbol(buyer.key, nft.currency)

            if (!buyerAccount) {
                throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('nft.service', 'makeOffers', { key }))
            }

            const buyerBalance = parsePrimeAmount(Number(buyerAccount.amount) - Number(buyerAccount.amount_locked))
            const paymentOrderValue = parsePrimeAmount(nft.price)

            if (buyerBalance.lt(paymentOrderValue)) {
                throw new BizException(
                    NftErrors.purchase_insufficient_funds_error,
                    new ErrorContext('nft.service', 'makeOffers', { price: nft.price })
                )
            }

            const preBuyerLockedAmount = buyerAccount.amount_locked
            buyerAccount = await AccountService.lockAmount(buyerAccount.key, params.amount)
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: buyerAccount.user_key,
                account_key: buyerAccount.key,
                symbol: buyerAccount.symbol,
                address: buyerAccount.address,
                type: AccountActionType.MakeOffer,
                amount: Number(params.amount),
                pre_amount: buyerAccount.amount,
                pre_amount_locked: preBuyerLockedAmount,
                post_amount: buyerAccount.amount,
                post_amount_locked: buyerAccount.amount_locked,
                note: `Offer - item: ${nft.key} , lock amount: ${params.amount}`,
                operator: operator,
                options
            })

            await NftService.addNftOffer({
                key: undefined,
                status: OfferStatusType.Pending,
                user_key: buyer.key,
                nft_key: nft.key,
                collection_key: nft.collection_key,
                price: Number(params.amount),
                currency: nft.currency,
                user: {
                    key: buyer.key,
                    chat_name: buyer.chat_name,
                    avatar: buyer.avatar
                },
                secondary_market: nft.creator_key !== nft.owner_key
            })

            if (seller.email) {
                EmailService.sendReceivedOfferNotification({ address: seller.email, nft })
            }
            session.endSession()
            return { success: true }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }

    static async processAcceptOffer(key: string, operator: IOperator, options: IOptions) {
        let data = null
        if (config.redis.enabled) {
            data = await addToAcceptOfferQueue({ key, operator, options })
        } else {
            data = await NftService.acceptOffer(key, operator, options)
        }
        return data
    }

    static async rejectOffer(key: string, operator: IOperator, options: IOptions) {
        const session = await UserModel.startSession()
        session.startTransaction()
        try {
            const offer = await NftOfferModel.findOne({ key })
            if (!offer) {
                throw new BizException(NftErrors.offer_not_exists_error, new ErrorContext('nft.service', 'rejectOffers', { key }))
            }
            if (offer.status !== OfferStatusType.Pending) {
                throw new BizException(NftErrors.offer_status_error, new ErrorContext('nft.service', 'rejectOffers', { status: offer.status }))
            }
            const nft = await NftModel.findOne({ key: offer.nft_key, removed: false }).exec()
            if (!nft) {
                throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'rejectOffers', { key }))
            }
            if (nft.owner_key !== operator.key) {
                throw new BizException(NftErrors.offer_permissions_error, new ErrorContext('nft.service', 'rejectOffers', { user_key: operator.key }))
            }
            const buyer = await UserService.getBriefByKey(offer.user_key, true)
            let buyerAccount = await AccountService.getAccountByUserKeyAndSymbol(offer.user_key, offer.currency)
            if (!buyerAccount || !buyer) {
                throw new BizException(NftErrors.offer_permissions_error, new ErrorContext('nft.service', 'rejectOffers', { user_key: operator.key }))
            }
            offer.status = OfferStatusType.Rejected
            await offer.save()

            const preBuyerLockedAmount = buyerAccount.amount_locked
            buyerAccount = await AccountService.unlockAmount(buyerAccount.key, offer.price)
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: buyerAccount.user_key,
                account_key: buyerAccount.key,
                symbol: buyerAccount.symbol,
                address: buyerAccount.address,
                type: AccountActionType.MakeOffer,
                amount: Number(offer.price),
                pre_amount: buyerAccount.amount,
                pre_amount_locked: preBuyerLockedAmount,
                post_amount: buyerAccount.amount,
                post_amount_locked: buyerAccount.amount_locked,
                note: `Offer Rejected - item: ${offer.nft_key} , unlock amount: ${offer.price}`,
                operator: operator,
                options
            })
            return { success: true }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }

    static async cancelOffer(key: string, operator: IOperator, options: IOptions) {
        const session = await UserModel.startSession()
        session.startTransaction()
        try {
            const offer = await NftOfferModel.findOne({ key })
            if (!offer) {
                throw new BizException(NftErrors.offer_not_exists_error, new ErrorContext('nft.service', 'cancelOffers', { key }))
            }
            if (offer.status !== OfferStatusType.Pending) {
                throw new BizException(NftErrors.offer_status_error, new ErrorContext('nft.service', 'cancelOffers', { status: offer.status }))
            }
            const nft = await NftModel.findOne({ key: offer.nft_key, removed: false }).exec()
            if (!nft) {
                throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'cancelOffers', { key }))
            }
            if (offer.user_key !== operator.key) {
                throw new BizException(NftErrors.offer_permissions_error, new ErrorContext('nft.service', 'cancelOffers', { user_key: operator.key }))
            }
            const buyer = await UserService.getBriefByKey(offer.user_key, true)
            let buyerAccount = await AccountService.getAccountByUserKeyAndSymbol(offer.user_key, offer.currency)
            if (!buyerAccount || !buyer) {
                return
            }
            offer.status = OfferStatusType.Canceled
            await offer.save()

            const preBuyerLockedAmount = buyerAccount.amount_locked
            buyerAccount = await AccountService.unlockAmount(buyerAccount.key, offer.price)
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: buyerAccount.user_key,
                account_key: buyerAccount.key,
                symbol: buyerAccount.symbol,
                address: buyerAccount.address,
                type: AccountActionType.MakeOffer,
                amount: Number(offer.price),
                pre_amount: buyerAccount.amount,
                pre_amount_locked: preBuyerLockedAmount,
                post_amount: buyerAccount.amount,
                post_amount_locked: buyerAccount.amount_locked,
                note: `Offer Canceled - item: ${offer.nft_key} , unlock amount: ${offer.price}`,
                operator: operator,
                options
            })
            return { success: true }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }

    static async addNftOffer(params: INftOffer) {
        const model = new NftOfferModel({
            ...params
        })
        return await model.save()
    }

    static async acceptOffer(key: string, operator: IOperator, options: IOptions) {
        const session = await UserModel.startSession()
        session.startTransaction()
        try {
            const offer = await NftOfferModel.findOne({ key, removed: false }).exec()
            if (!offer) {
                throw new BizException(NftErrors.offer_not_exists_error, new ErrorContext('nft.service', 'acceptOffer', { key }))
            }
            if (offer.status !== OfferStatusType.Pending) {
                throw new BizException(NftErrors.offer_status_error, new ErrorContext('nft.service', 'acceptOffer', { status: offer.status }))
            }
            if (offer.user_key === operator.key) {
                throw new BizException(NftErrors.offer_permissions_error, new ErrorContext('nft.service', 'acceptOffer', { user_key: operator.key }))
            }

            const nft = await NftModel.findOne({ key: offer.nft_key, removed: false }).exec()
            if (!nft) {
                throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'acceptOffer', { key: offer.nft_key }))
            }
            if (nft.owner_key !== operator.key) {
                throw new BizException(
                    NftErrors.offer_permissions_error,
                    new ErrorContext('nft.service', 'acceptOffer', { key, owner_key: nft.owner_key })
                )
            }
            const creator = await UserService.getBriefByKey(nft.creator_key, true)
            const seller = await UserService.getBriefByKey(nft.owner_key, true)
            const buyer = await UserService.getBriefByKey(offer.user_key, true)

            if (!seller || !seller.key || !buyer || !seller.key) {
                throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('nft.service', 'acceptOffer', { key }))
            }

            let { buyerTxn, sellerTxn, royaltyTxn, commissionFee, royaltyFee, buyerAccount } = await NftTradingService.allocatePrimeCoins(
                nft,
                buyer,
                seller,
                operator,
                options
            )

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

            const updateData: any = { owner_key: buyer.key, on_market: false, last_sale_date: new Date(), last_purchase }

            const data = await NftModel.findOneAndUpdate(
                { key: nft.key },
                {
                    $set: updateData
                },
                { new: true }
            )

            await new NftHistoryModel({
                key: undefined,
                nft_key: key,
                operator,
                action: NftActions.Purchase,
                options,
                pre_data: nft.toJSON(),
                post_data: data?.toJSON()
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
                creator: { key: creator.key, avatar: creator.avatar, chat_name: creator.chat_name },
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

            offer.status = OfferStatusType.Accepted
            await offer.save()

            const preBuyerLockedAmount = buyerAccount.amount_locked
            buyerAccount = await AccountService.unlockAmount(buyerAccount.key, offer.price)
            await AccountSnapshotService.createAccountSnapshot({
                key: undefined,
                user_key: buyerAccount.user_key,
                account_key: buyerAccount.key,
                symbol: buyerAccount.symbol,
                address: buyerAccount.address,
                type: AccountActionType.MakeOffer,
                amount: Number(offer.price),
                pre_amount: buyerAccount.amount,
                pre_amount_locked: preBuyerLockedAmount,
                post_amount: buyerAccount.amount,
                post_amount_locked: buyerAccount.amount_locked,
                note: `Offer Accepted - item: ${offer.nft_key} , unlock amount: ${offer.price}`,
                operator: operator,
                options
            })

            session.endSession()
            return { buyer_txn: buyerTxn, seller_txn: sellerTxn, royalty_txn: royaltyTxn }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }

    static async updateNftFeatured(key: string, updateNftFeaturedDto: UpdateNftFeaturedDto, operator: IOperator, options: IOptions) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('account.service', 'updateNftFeatured', { key }))
        }
        const preNft = nft
        nft.set('featured', updateNftFeaturedDto.featured ?? nft.featured, Boolean)

        const updatedNft = await nft.save()

        // create log
        await new NftHistoryModel({
            key: undefined,
            nft_key: key,
            action: NftActions.UpdateFeatured,
            operator: operator,
            options: options,
            pre_data: { featured: preNft.featured },
            post_data: { featured: updatedNft.featured }
        }).save()

        return NftHelper.formatNftRO(updatedNft)
    }

    static async getRelatedNfts(key: string, limit: number) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'getRelatedNfts', { key }))
        }

        const filter: any = {
            key: { $ne: nft.key },
            $or: [{ creator_key: nft.creator_key }]
        }
        if (nft.collection_key) {
            filter.$or.push({ collection_key: nft.collection_key })
        }

        const nfts = await NftModel.find(filter).sort({ collection_key: 1, created: -1 }).limit(limit)
        return NftHelper.formatNftListRO(nfts)
    }

    static async getNftBriefByKeys(keys: String[]) {
        const nfts = await NftModel.find({ key: { $in: keys } }).select('key name image animation collection_key price')
        return nfts
    }

    static async getNftPurchaseLogs(nft_key: string) {
        const bids = await NftSaleLogModel.find({ nft_key }, { _id: 0 }).sort({ _id: -1 })
        return bids
    }

    static async getNftOwnershipLogs(nft_key: string) {
        const bids = await NftOwnershipLogModel.find({ nft_key }, { _id: 0 }).sort({ _id: -1 })
        return bids
    }

    static async uploadNftIpfs(nft: INft) {
        // @ts-ignore
        const image = nft.image?.original
        const files = [{ field_name: 'image', aws_key: image }]
        const assets = await uploadIpfs(files)
        const updateImage = { ...nft.image, ipfs_cid: assets[0]?.ipfs_cid }
        const updateData = { image: updateImage }
        const data = await NftModel.findOneAndUpdate(
            { key: nft.key },
            {
                $set: updateData
            },
            { new: true }
        )
        return data
    }
}
