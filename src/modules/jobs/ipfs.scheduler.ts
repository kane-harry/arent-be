import NftService from '@modules/nft/nft.service'
import { NftModel } from '@modules/nft/nft.model'
import IScheduler from '@interfaces/scheduler.interface'
import cron from 'node-cron'
import { CollectionModel } from '@modules/collection/collection.model'
import CollectionService from '@modules/collection/collection.service'

export default class IpfsScheduler implements IScheduler {
    constructor() {
        this.handleNftIpfs()
        this.handleCollectionIpfs()
    }

    private async handleNftIpfs() {
        const task = cron.schedule('*/2 * * * *', async () => {
            const nfts = await NftModel.find({ 'image.ipfs_cid': null }, { _id: 0 }).sort({ created: -1 }).limit(10)
            for (let i = 0; i < nfts.length; i++) {
                await NftService.uploadNftIpfs(nfts[i])
            }
        })
        task.start()
    }

    private async handleCollectionIpfs() {
        const task = cron.schedule('*/2 * * * *', async () => {
            const collections = await CollectionModel.find({ 'logo.ipfs_cid': null }, { _id: 0 }).sort({ created: -1 }).limit(10)
            for (let i = 0; i < collections.length; i++) {
                await CollectionService.uploadCollectionIpfs(collections[i])
            }
        })
        task.start()
    }
}
