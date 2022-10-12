import IScheduler from '@interfaces/scheduler.interface'
import cron from 'node-cron'
import UserService from '@modules/user/user.service'
import CollectionService from '@modules/collection/collection.service'
import { NftSaleLogModel } from '@modules/nft/nft.model'
import { uniq } from 'lodash'

export default class RankingScheduler implements IScheduler {
    constructor() {
        this.generateCollectionRanking()
        this.generateUserRanking()
    }

    private async generateCollectionRanking() {
        const task = cron.schedule('*/30 * * * *', async () => {
            console.log(`${new Date()} execute task - Generate Collection Ranking`)
            const collections = await NftSaleLogModel.distinct('collection_key', {}).exec()
            for (const collection_key of collections) {
                await CollectionService.generateCollectionRanking(collection_key)
            }
        })
        task.start()
    }

    private async generateUserRanking() {
        const task = cron.schedule('*/30 * * * *', async () => {
            console.log(`${new Date()} execute task - Generate User Ranking`)
            const sellerKeys = await NftSaleLogModel.distinct('seller.key', {}).exec()
            const buyerKeys = await NftSaleLogModel.distinct('buyer.key', {}).exec()
            const creatorKeys = await NftSaleLogModel.distinct('creator.key', {}).exec()
            const userKeys = uniq(sellerKeys.concat(buyerKeys, creatorKeys))
            for (const userKey of userKeys) {
                await UserService.generateUserRanking(userKey)
            }
        })
        task.start()
    }
}
