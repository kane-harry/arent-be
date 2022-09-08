import { IUser } from '@modules/user/user.interface'
import { BuyNftDto, CreateNftDto, ImportNftDto, NftOnMarketDto, NftRO, UpdateNftDto, UpdateNftStatusDto } from './nft.dto'
import {NftImportLogModel, NftModel, NftOwnershipLogModel, NftSaleLogModel} from './nft.model'
import { ICollection, ICollectionFilter } from '@modules/collection/collection.interface'
import { CollectionModel } from '@modules/collection/collection.model'
import { QueryRO } from '@interfaces/query.model'
import { INft, INftFilter } from '@modules/nft/nft.interface'
import BizException from '@exceptions/biz.exception'
import { AccountErrors, AuthErrors, CommonErrors, NftErrors } from '@exceptions/custom.error'
import ErrorContext from '@exceptions/error.context'
import { isAdmin, role, roleCan } from '@config/role'
import UserService from '@modules/user/user.service'
import { NftHistoryActions, NftStatus, MASTER_ACCOUNT_KEY, NftType, NFT_IMAGE_SIZES } from '@config/constants'
import NftHistoryModel from '@modules/nft_history/nft_history.model'
import CollectionService from '@modules/collection/collection.service'
import { resizeImages, uploadFiles } from '@utils/s3Upload'
import { filter } from 'lodash'
import UserModel from '@modules/user/user.model'
import AccountService from '@modules/account/account.service'
import TransactionService from '@modules/transaction/transaction.service'
import { SendPrimeCoinsDto } from '@modules/transaction/transaction.dto'
import { IAccount } from '@modules/account/account.interface'
import { config } from '@config'
import addToBuyProductQueue from '@modules/queues/nft_queue'
import { roundUp } from '@utils/utility'
import SettingService from '@modules/setting/setting.service'
import { formatAmount, parsePrimeAmount } from '@utils/number'
import { PrimeCoinProvider } from '@providers/coin.provider'
import { ISendCoinDto } from '@modules/transaction/transaction.interface'
import { decryptKeyWithSalt, signMessage } from '@utils/wallet'

export default class NftService {
    static async importNft(payload: ImportNftDto, operator: IUser) {
        const model = new NftImportLogModel({
            ...payload,
            creator: operator.key
        })
        return await model.save()
    }

    static async createNft(createNftDto: CreateNftDto, files: any, operator: IUser, options: any) {
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

        if (!createNftDto.collection_key || !createNftDto.collection_key.length) {
            const collection = await CollectionService.createDefaultCollection(createNftDto, operator)
            createNftDto.collection_key = collection?.key ?? ''
        }
        const model = new NftModel({
            ...createNftDto,
            image: image,
            animation: animation,
            status: isAdmin(operator.role) ? NftStatus.Approved : NftStatus.Pending,
            creator_key: operator.key,
            owner_key: isAdmin(operator.role) ? MASTER_ACCOUNT_KEY : operator.key,
            on_market: false
        })
        const nft = await model.save()
        await CollectionModel.findOneAndUpdate({ key: nft.collection_key }, { $inc: { items_count: 1 } }, { new: true }).exec()

        // create log
        await new NftHistoryModel({
            nft_key: nft.key,
            user_key: operator.key,
            action: NftHistoryActions.Create,
            agent: options?.req.agent,
            country: operator.country,
            ip_address: options?.req.ip_address,
            pre_data: null,
            post_data: nft.toString()
        }).save()

        return nft
    }

    static async queryNfts(params: INftFilter) {
        const offset = (params.page_index - 1) * params.page_size
        const filter: any = { $and: [{ removed: false }] }
        const sorting: any = { _id: 1 }
        if (params.terms) {
            const reg = new RegExp(params.terms)
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
        if (params.sort_by) {
            delete sorting._id
            sorting[`${params.sort_by}`] = params.order_by === 'asc' ? 1 : -1
        }
        const totalCount = await NftModel.countDocuments(filter)
        const items = await NftModel.find<INft>(filter).sort(sorting).skip(offset).limit(params.page_size).exec()
        return new QueryRO<INft>(totalCount, params.page_index, params.page_size, items)
    }

    static async updateNft(key: string, updateNftDto: UpdateNftDto, operator: IUser, options: any) {
        const nft = await NftModel.findOne({ key, owner: operator.key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('account.service', 'initAccounts', { key }))
        }
        const preNft = nft
        nft.set('name', updateNftDto.name ?? nft.name, String)
        nft.set('description', updateNftDto.description ?? nft.description, String)
        nft.set('price', updateNftDto.price ?? nft.price, String)
        nft.set('attributes', updateNftDto.attributes ?? nft.attributes, Array)
        nft.set('meta_data', updateNftDto.meta_data ?? nft.meta_data, Array)
        nft.set('collection_key', updateNftDto.collection_key ?? nft.collection_key, String)
        nft.set('quantity', updateNftDto.quantity ?? nft.quantity, Number)

        const updateNft = await nft.save()

        // create log
        await new NftHistoryModel({
            nft_key: key,
            user_key: operator.key,
            action: NftHistoryActions.Update,
            agent: options?.req.agent,
            country: operator.country,
            ip_address: options?.req.ip_address,
            pre_data: preNft.toString(),
            post_data: updateNft.toString()
        }).save()

        return updateNft
    }

    static async updateNftStatus(key: string, updateNftStatusDto: UpdateNftStatusDto, operator: IUser, options: any) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('account.service', 'updateNftStatus', { key }))
        }
        const preNft = nft
        nft.set('status', updateNftStatusDto.status ?? nft.status, String)

        const updateNft = await nft.save()

        // create log
        await new NftHistoryModel({
            nft_key: key,
            user_key: operator.key,
            action: NftHistoryActions.UpdateStatus,
            agent: options?.req.agent,
            country: operator.country,
            ip_address: options?.req.ip_address,
            pre_data: { status: preNft.status },
            post_data: { status: updateNft.status }
        }).save()

        return updateNft
    }

    static async deleteNft(key: string, operator: IUser, options: any) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.controller', 'deleteNft', { key }))
        }
        if (!isAdmin(operator?.role) && operator?.key !== nft.owner_key) {
            throw new BizException(AuthErrors.user_permission_error, new ErrorContext('nft.controller', 'deleteNft', { key }))
        }
        const preNft = nft
        nft.set('owner_key', '00000000000000000000000000000000', String)
        nft.set('removed', true, Boolean)
        const updateNft = await nft.save()

        await CollectionModel.findOneAndUpdate({ key: nft.collection_key }, { $inc: { items_count: -1 } }, { new: true }).exec()
        // create log
        await new NftHistoryModel({
            nft_key: key,
            user_key: operator.key,
            action: NftHistoryActions.Delete,
            agent: options?.req.agent,
            country: operator.country,
            ip_address: options?.req.ip_address,
            pre_data: preNft.toString(),
            post_data: updateNft.toString()
        }).save()

        return updateNft
    }

    static async getNftDetail(key: string) {
        const nft = await NftModel.findOne({ key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.controller', 'getNFTDetail', { key }))
        }
        const owner = await UserService.getBriefByKey(nft.owner_key)
        const creator = await UserService.getBriefByKey(nft.creator_key)
        const collection = await CollectionModel.findOne({ key: nft.collection_key })
        return new NftRO<INft>(nft, owner, creator, collection)
    }

    static async onMarket(key: string, params: NftOnMarketDto, options: any) {
        const user: IUser = options.req.user
        const nft = await NftModel.findOne({ key, owner_key: user.key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        if (!roleCan(user.role, config.operations.PUT_NFT_ON_MARKET) && nft.owner_key !== user.key) {
            throw new BizException(CommonErrors.unauthorised, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        if (nft.status !== NftStatus.Approved) {
            throw new BizException(NftErrors.nft_is_not_approved_error, new ErrorContext('nft.service', 'onMarket', { key }))
        }

        if (params.price) {
            nft.set('price', params.price)
        }
        nft.set('on_market', true)

        // TODO: AUCTION

        const postData = await nft.save()
        await new NftHistoryModel({
            nft_key: key,
            user_key: user.key,
            action: NftHistoryActions.OnMarket,
            agent: options?.req.agent,
            country: user.country,
            ip_address: options?.req.ip_address,
            pre_data: nft.toString(),
            post_data: postData?.toString()
        }).save()

        return postData
    }

    static async offMarket(key: string, options: any) {
        const user: IUser = options.req.user
        const nft = await NftModel.findOne({ key, owner_key: user.key })
        if (!nft) {
            throw new BizException(NftErrors.nft_not_exists_error, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        if (!roleCan(user.role, config.operations.PUT_NFT_OFF_MARKET) && nft.owner_key !== user.key) {
            throw new BizException(CommonErrors.unauthorised, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        if (nft.status !== NftStatus.Approved) {
            throw new BizException(NftErrors.nft_is_not_approved_error, new ErrorContext('nft.service', 'onMarket', { key }))
        }
        nft.set('on_market', false)

        const postData = await nft.save()
        await new NftHistoryModel({
            nft_key: key,
            user_key: user.key,
            action: NftHistoryActions.OffMarket,
            agent: options?.req.agent,
            country: user.country,
            ip_address: options?.req.ip_address,
            pre_data: nft.toString(),
            post_data: postData?.toString()
        }).save()

        return postData
    }

    static async processPurchase(key: string, operator: IUser, agent: string, ip: string) {
        let data = null
        if (config.redis.enabled) {
            data = await addToBuyProductQueue({ key, operator, agent, ip })
        } else {
            data = await NftService.buyNft(key, operator, agent, ip)
        }
        return data
    }

    static async buyNft(key: string, operator: IUser, agent: string, ip: string) {
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

            // TODO : auction nft
            // if (item.price_type === constants.product.price_type.auction) {
            // throw new BizException(NftErrors.purchase_auction_nft_error, new ErrorContext('nft.service', 'buyNft', { key }))
            // }
            const seller = await UserService.getBriefByKey(nft.owner_key)
            const buyer = await UserService.getBriefByKey(operator.key)

            if (!seller || !buyer) {
                throw new BizException(AuthErrors.user_not_exists_error, new ErrorContext('nft.service', 'buyNft', { key }))
            }

            const masterAccount: IAccount | null = await AccountService.getMasterAccountBriefBySymbol(nft.currency)
            const creatorAccount: IAccount | null = await AccountService.getAccountByUserKeyAndSymbol(nft.creator_key, nft.currency)
            const sellerAccount: IAccount | null = await AccountService.getAccountByUserKeyAndSymbol(seller.key, nft.currency)
            const buyerAccount: IAccount | null = await AccountService.getAccountByUserKeyAndSymbol(buyer.key, nft.currency)

            if (!sellerAccount || !buyerAccount || !masterAccount || !creatorAccount) {
                throw new BizException(AccountErrors.account_not_exists_error, new ErrorContext('nft.service', 'buyNft', { key }))
            }

            const setting = await SettingService.getGlobalSetting()

            const nftTradingRate = parseFloat(setting.nft_trade_fee_rate.toString())
            const buyerBalance = parsePrimeAmount(Number(buyerAccount.amount) - Number(buyerAccount.amount_locked))
            const paymentOrderValue = parsePrimeAmount(nft.price)
            const nftTradingFee = parsePrimeAmount(parseFloat(nft.price.toString()) * nftTradingRate)
            const royaltyRate = parseFloat(nft.royalty.toString())

            const buyerToMasterAmount = paymentOrderValue
            const royaltyAmount = parsePrimeAmount(parseFloat(nft.price.toString()) * royaltyRate)
            const masterToSellerAmount = buyerToMasterAmount.sub(nftTradingFee).sub(royaltyAmount)

            if (buyerBalance.lt(paymentOrderValue)) {
                throw new BizException(NftErrors.purchase_insufficient_funds_error, new ErrorContext('nft.service', 'buyNft', { price: nft.price }))
            }
            // const transferFee = Number(setting.prime_transfer_fee || 0)
            const txnDetails = {
                type: 'PRODUCT',
                nft_key: nft.key,
                nft_name: nft.name,
                nft_price: nft.price,
                currency: nft.currency,
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
            let royaltyFee
            let masterNonce
            if (royaltyAmount.gt(0)) {
                // 2. master send royalty to creator

                masterNonce = await PrimeCoinProvider.getWalletNonceBySymbolAndAddress(masterAccount.symbol, masterAccount.address)
                masterNonce = masterNonce + 1
                royaltyFee = formatAmount(royaltyAmount.toString())
                const royaltyMessage = `${nft.currency}:${masterAccount.address}:${creatorAccount.address}:${royaltyFee}:${masterNonce}`
                const royaltySignature = await signMessage(masterPrivateKey, royaltyMessage)

                txnDetails.type = 'NFT_ROYALTY'
                const royaltyTxnParams: ISendCoinDto = {
                    symbol: nft.currency,
                    sender: masterAccount.address,
                    recipient: creatorAccount.address,
                    amount: royaltyFee,
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
                { key: key },
                {
                    $set: updateData
                },
                { projection: { _id: 0 }, returnOriginal: false }
            )

            await new NftHistoryModel({
                nft_key: key,
                user_key: buyer.key,
                action: NftHistoryActions.Purchase,
                agent: agent,
                country: buyer.country,
                ip_address: ip,
                pre_data: nft.toString(),
                post_data: data?.toString()
            }).save()

            await NftService.addSaleLog({buyer, seller, nft, buyer_txn, royalty_txn, seller_txn, royaltyFee, sellerAmount})
            await NftService.addOwnershipLog({buyer, seller, nft, buyer_txn, royalty_txn, seller_txn})
            await NftService.sendEmail({buyer, seller, nft, buyer_txn, royalty_txn, seller_txn})

            session.endSession()
            return { buyer_txn, royalty_txn, seller_txn }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    }

    static async addSaleLog(options:any) {
        const {buyer, seller, nft, buyer_txn, royalty_txn, seller_txn, royaltyFee, sellerAmount} = options
        const nftSaleLog = new NftSaleLogModel()
        nftSaleLog.nft_key = nft.key
        nftSaleLog.price = nft.price
        nftSaleLog.seller_amount = sellerAmount
        nftSaleLog.royalty_fee = royaltyFee
        return await nftSaleLog.save()
    }

    static async addOwnershipLog(options:any) {
        const {buyer, seller, nft, buyer_txn, royalty_txn, seller_txn} = options
        const nftOnwershipLog = new NftOwnershipLogModel()
        nftOnwershipLog.nft_key = nft.key
        nftOnwershipLog.price = nft.price
        nftOnwershipLog.previous_owner = seller.key
        nftOnwershipLog.current_owner = buyer.key
        return await nftOnwershipLog.save()
    }

    static async sendEmail(options:any) {
        const {buyer, seller, nft, buyer_txn, royalty_txn, seller_txn} = options
        // TODO
        if (buyer.email) {

        }
        if (seller.email) {

        }
    }
}
