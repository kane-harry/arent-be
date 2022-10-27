import NftService from '@modules/nft/nft.service'
import IScheduler from '@interfaces/scheduler.interface'
import cron from 'node-cron'
import CollectionService from '@modules/collection/collection.service'

export default class RarityScheduler implements IScheduler {
    constructor() {
        this.computeNftsRarity()
        this.computeCollectionsAttributes()
    }

    private async computeNftsRarity() {
        const task = cron.schedule('*/60 * * * *', async () => {
            console.log(`${new Date()} execute task - computeNftsRarity`)
            await NftService.computeNftsRarity()
        })
        task.start()
    }

    private async computeCollectionsAttributes() {
        const task = cron.schedule('*/60 * * * *', async () => {
            console.log(`${new Date()} execute task - computeCollectionsAttributes`)
            await CollectionService.computeCollectionsAttributes()
        })
        task.start()
    }
}
