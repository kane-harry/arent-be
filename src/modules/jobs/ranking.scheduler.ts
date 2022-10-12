import IScheduler from '@interfaces/scheduler.interface'
import cron from 'node-cron'
import { config } from '@config'
import { roundUp } from '@utils/utility'
import { NftModel, NftSaleLogModel } from '@modules/nft/nft.model'
import { sumBy, uniq } from 'lodash'
import moment from 'moment'
import { CollectionModel, CollectionRankingModel } from '@modules/collection/collection.model'
import { ICollectionRanking } from '@modules/collection/collection.interface'
import { NftStatus } from '@config/constants'
import UserFollowerModel from '@modules/user_follower/user.follower.model'
import NftFavoriteModel from '@modules/nft_favorite/nft.favorite.model'
import UserModel from '@modules/user/user.model'
import { IUserRanking } from '@modules/user/user.interface'
import { UserRankingModel } from '@modules/user/user.ranking.model'

export default class RankingScheduler implements IScheduler {
    constructor() {
        this.generateCollectionRanking()
        this.generateUserRanking()
    }

    private async generateCollectionRanking() {
        const task = cron.schedule('*/30 * * * *', async () => {
            // const task = cron.schedule('* */8 * * *', async () => {
            console.log(`${new Date()} execute task - Generate Collection Ranking`)

            const collections = await NftSaleLogModel.distinct('collection_key', {}).exec()
            for (const collection_key of collections) {
                // 1.1 market price - Average of last 5 orders
                // get last 5 orders
                const orders = await NftSaleLogModel.find({ collection_key }, { unit_price: 1 }).sort({ created: -1 }).limit(5).exec()
                const order_volume = sumBy(orders, 'unit_price')
                const market_price = orders.length > 0 ? roundUp(order_volume / orders.length, 8) : 0

                // 1.2 owners
                const owners = await NftModel.aggregate([{ $match: { collection_key } }, { $group: { _id: '$owner_key', count: { $sum: 1 } } }])
                const number_of_owners = owners.length

                // 1.3 trading volume
                const volumeTotal = await NftSaleLogModel.aggregate([
                    { $match: { collection_key } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                const number_of_orders = volumeTotal && volumeTotal[0] ? volumeTotal[0].count : 0
                const trading_volume = volumeTotal && volumeTotal[0] ? parseFloat(volumeTotal[0].trading_volume) : 0

                // 1.4 24 hrs volume
                const volume24Hrs = await NftSaleLogModel.aggregate([
                    { $match: { collection_key, created: { $gte: moment().add(-1, 'days').toDate() } } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                const number_of_orders_24hrs = volume24Hrs && volume24Hrs[0] ? volume24Hrs[0].count : 0
                const trading_volume_24hrs = volume24Hrs && volume24Hrs[0] ? parseFloat(volume24Hrs[0].trading_volume) : 0

                // 1.5 nft prices - Minimum price available in the market for the collection
                const nftPriceAggegates = await NftModel.aggregate([
                    { $match: { collection_key, status: NftStatus.Approved, removed: false } },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                            max_price: { $max: '$price' },
                            min_price: { $min: '$price' },
                            avg_price: { $avg: '$price' }
                        }
                    }
                ])
                const number_of_items = nftPriceAggegates && nftPriceAggegates[0] ? nftPriceAggegates[0].count : 0
                const item_floor_price = nftPriceAggegates && nftPriceAggegates[0] ? parseFloat(nftPriceAggegates[0].min_price) : 0
                const item_celling_price = nftPriceAggegates && nftPriceAggegates[0] ? parseFloat(nftPriceAggegates[0].max_price) : 0
                const item_average_price = nftPriceAggegates && nftPriceAggegates[0] ? parseFloat(nftPriceAggegates[0].avg_price) : 0

                // 1.6 order prices
                const orderPriceAggregate = await NftSaleLogModel.aggregate([
                    { $match: { collection_key, status: NftStatus.Approved, removed: false } },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                            max_price: { $max: '$unit_price' },
                            min_price: { $min: '$unit_price' },
                            avg_price: { $avg: '$unit_price' }
                        }
                    }
                ])
                const order_average_price = orderPriceAggregate && orderPriceAggregate[0] ? parseFloat(orderPriceAggregate[0].min_price) : 0
                const order_floor_price = orderPriceAggregate && orderPriceAggregate[0] ? parseFloat(orderPriceAggregate[0].max_price) : 0
                const order_celling_price = orderPriceAggregate && orderPriceAggregate[0] ? parseFloat(orderPriceAggregate[0].avg_price) : 0

                const ranking: ICollectionRanking = {
                    collection_key,
                    market_price,
                    number_of_owners,
                    trading_volume,
                    number_of_orders,
                    trading_volume_24hrs,
                    number_of_orders_24hrs,
                    number_of_items,
                    item_average_price,
                    item_floor_price,
                    item_celling_price,
                    order_average_price,
                    order_floor_price,
                    order_celling_price,
                    updated: new Date()
                }
                await CollectionModel.findOneAndUpdate(
                    { key: collection_key },
                    {
                        $set: { ranking }
                    },
                    { new: true }
                )
                await new CollectionRankingModel({
                    ...ranking
                }).save()
            }
        })
        task.start()
    }

    private async generateUserRanking() {
        const task = cron.schedule('*/30 * * * *', async () => {
            // const task = cron.schedule('* */8 * * *', async () => {
            console.log(`${new Date()} execute task - Generate User Ranking`)

            const sellerKeys = await NftSaleLogModel.distinct('seller.key', {}).exec()
            const buyerKeys = await NftSaleLogModel.distinct('buyer.key', {}).exec()
            const creatorKeys = await NftSaleLogModel.distinct('creator.key', {}).exec()
            const userKeys = uniq(sellerKeys.concat(buyerKeys, creatorKeys))
            for (const userKey of userKeys) {
                const number_of_followers = await UserFollowerModel.countDocuments({ user_key: userKey })
                const number_of_followings = await UserFollowerModel.countDocuments({ follower_key: userKey })
                const number_of_nft_liked = await NftFavoriteModel.countDocuments({ user_key: userKey })
                const number_of_nft_created = await NftModel.countDocuments({ creator_key: userKey, status: NftStatus.Approved })

                //  owners of created nfts
                const owners = await NftModel.aggregate([{ $match: { creator_key: userKey } }, { $group: { _id: '$owner_key', count: { $sum: 1 } } }])
                const number_of_created_nfts_owners = owners.length

                // trading volume of created nfts
                const volumeTotal = await NftSaleLogModel.aggregate([
                    { $match: { 'creator.key': userKey } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                const number_of_created_nfts_orders = volumeTotal && volumeTotal[0] ? volumeTotal[0].count : 0
                const trading_volume_of_created_nfts = volumeTotal && volumeTotal[0] ? parseFloat(volumeTotal[0].trading_volume) : 0

                // 24 hrs volume of created nfts
                const volume24Hrs = await NftSaleLogModel.aggregate([
                    { $match: { 'creator.key': userKey, created: { $gte: moment().add(-1, 'days').toDate() } } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                const number_of_created_nfts_orders_24hrs = volume24Hrs && volume24Hrs[0] ? volume24Hrs[0].count : 0
                const trading_volume_of_created_nfts_24hrs = volume24Hrs && volume24Hrs[0] ? parseFloat(volume24Hrs[0].trading_volume) : 0

                // trading volume of buying
                const buyingVolumeTotal = await NftSaleLogModel.aggregate([
                    { $match: { 'buyer.key': userKey } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                const number_of_buying_orders = buyingVolumeTotal && buyingVolumeTotal[0] ? buyingVolumeTotal[0].count : 0
                const trading_volume_of_buying = buyingVolumeTotal && buyingVolumeTotal[0] ? parseFloat(buyingVolumeTotal[0].trading_volume) : 0

                // 24 hrs volume of selling
                const buyingVolume24Hrs = await NftSaleLogModel.aggregate([
                    { $match: { 'buyer.key': userKey, created: { $gte: moment().add(-1, 'days').toDate() } } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                const number_of_buying_orders_24hrs = buyingVolume24Hrs && buyingVolume24Hrs[0] ? buyingVolume24Hrs[0].count : 0
                const trading_volume_of_buying_24hrs = buyingVolume24Hrs && buyingVolume24Hrs[0] ? parseFloat(buyingVolume24Hrs[0].trading_volume) : 0

                // trading volume of created nfts
                const sellingVolumeTotal = await NftSaleLogModel.aggregate([
                    { $match: { 'seller.key': userKey } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                const number_of_selling_orders = sellingVolumeTotal && sellingVolumeTotal[0] ? sellingVolumeTotal[0].count : 0
                const trading_volume_of_selling = sellingVolumeTotal && sellingVolumeTotal[0] ? parseFloat(sellingVolumeTotal[0].trading_volume) : 0

                // 24 hrs volume of created nfts
                const sellingVolume24Hrs = await NftSaleLogModel.aggregate([
                    { $match: { 'seller.key': userKey, created: { $gte: moment().add(-1, 'days').toDate() } } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                const number_of_selling_orders_24hrs = sellingVolume24Hrs && sellingVolume24Hrs[0] ? sellingVolume24Hrs[0].count : 0
                const trading_volume_of_selling_24hrs =
                    sellingVolume24Hrs && sellingVolume24Hrs[0] ? parseFloat(sellingVolume24Hrs[0].trading_volume) : 0

                const ranking: IUserRanking = {
                    user_key: userKey,
                    number_of_followers,
                    number_of_followings,
                    number_of_nft_liked,
                    number_of_nft_created,
                    number_of_created_nfts_owners,
                    number_of_created_nfts_orders,
                    trading_volume_of_created_nfts,
                    number_of_created_nfts_orders_24hrs,
                    trading_volume_of_created_nfts_24hrs,
                    number_of_buying_orders,
                    trading_volume_of_buying,
                    number_of_buying_orders_24hrs,
                    trading_volume_of_buying_24hrs,
                    number_of_selling_orders,
                    trading_volume_of_selling,
                    number_of_selling_orders_24hrs,
                    trading_volume_of_selling_24hrs,
                    updated: new Date()
                }
                await UserModel.findOneAndUpdate(
                    { key: userKey },
                    {
                        $set: { ranking }
                    },
                    { new: true }
                )
                await new UserRankingModel({
                    ...ranking
                }).save()
            }
        })
        task.start()
    }
}
