import IScheduler from '@interfaces/scheduler.interface'
import cron from 'node-cron'
import { config } from '@config'
import { roundUp } from '@utils/utility'
import { NftModel, NftSaleLogModel } from '@modules/nft/nft.model'
import { sumBy } from 'lodash'
import moment from 'moment'
import { CollectionModel } from '@modules/collection/collection.model'
import { ICollectionRanking } from '@modules/collection/collection.interface'

export default class RankingScheduler implements IScheduler {
    constructor() {
        this.generateCollectionRanking()
    }

    private async generateCollectionRanking() {
        const task = cron.schedule('* */8 * * *', async () => {
            console.log(`${new Date()} execute task - Generate Collection Ranking`)
            let market_price = 0
            let number_of_owners = 0
            let trading_volume = 0
            let number_of_orders = 0
            let trading_volume_24hrs = 0
            let number_of_orders_24hrs = 0
            let number_of_items = 0
            let floor_price = 0
            const collections = await NftSaleLogModel.distinct('collection_key', {}).exec()
            for (const collection_key of collections) {
                // 1.1 market price - Average of last 5 products sold
                // get last 5 orders
                const orders = await NftSaleLogModel.find({ collection_key }, { unit_price: 1 }).sort({ created: -1 }).limit(5).exec()
                const order_volume = sumBy(orders, 'unit_price')
                if (orders.length > 0) {
                    market_price = roundUp(order_volume / orders.length, 8)
                }
                // 1.2 owners
                const owners = await NftModel.aggregate([{ $match: { collection_key } }, { $group: { _id: '$owner_key', count: { $sum: 1 } } }])
                number_of_owners = owners.length

                // 1.3 trading volume
                const volumeTotal = await NftSaleLogModel.aggregate([
                    { $match: { collection_key, created: { $gte: moment().add(-1, 'days').toDate() } } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                number_of_orders = volumeTotal && volumeTotal[0] ? volumeTotal[0].count : 0
                trading_volume = volumeTotal && volumeTotal[0] ? parseFloat(volumeTotal[0].trading_volume) : 0

                // 1.4 24 hrs volume
                const volume24Hrs = await NftSaleLogModel.aggregate([
                    { $match: { collection_key, created: { $gte: moment().add(-1, 'days').toDate() } } },
                    { $group: { _id: null, count: { $sum: 1 }, trading_volume: { $sum: '$unit_price' } } }
                ])
                number_of_orders_24hrs = volume24Hrs && volume24Hrs[0] ? volume24Hrs[0].count : 0
                trading_volume_24hrs = volume24Hrs && volume24Hrs[0] ? parseFloat(volume24Hrs[0].trading_volume) : 0

                // 1.5 floor price - Minimum price available in the market for the collection
                const price_aggregate = await NftModel.aggregate([
                    { $match: { collection_key, removed: false } },
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
                number_of_items = price_aggregate && price_aggregate[0] ? price_aggregate[0].count : 0
                floor_price = price_aggregate && price_aggregate[0] ? parseFloat(price_aggregate[0].min_price) : 0

                const ranking: ICollectionRanking = {
                    market_price,
                    number_of_owners,
                    trading_volume,
                    number_of_orders,
                    trading_volume_24hrs,
                    number_of_orders_24hrs,
                    number_of_items,
                    floor_price,
                    updated: new Date()
                }
                await CollectionModel.findOneAndUpdate(
                    { key: collection_key },
                    {
                        $set: ranking
                    },
                    { new: true }
                )
            }
        })
        task.start()
    }
}
