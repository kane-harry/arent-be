import IScheduler from '@interfaces/scheduler.interface'
import cron from 'node-cron'
import UserService from '@modules/user/user.service'
import CollectionService from '@modules/collection/collection.service'

export default class RankingScheduler implements IScheduler {
    constructor() {
        this.generateCollectionRanking()
        this.generateUserRanking()
    }

    private async generateCollectionRanking() {
        const task = cron.schedule('*/30 * * * *', async () => {
            console.log(`${new Date()} execute task - Generate Collection Ranking`)
            await CollectionService.generateCollectionRanking
        })
        task.start()
    }

    private async generateUserRanking() {
        const task = cron.schedule('*/30 * * * *', async () => {
            console.log(`${new Date()} execute task - Generate User Ranking`)
            await UserService.generateUserRanking()
        })
        task.start()
    }
}
