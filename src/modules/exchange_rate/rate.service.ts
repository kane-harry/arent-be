import { unixTimestampToDate } from '@utils/utility'
import { RateLogModel, RateModel } from './rate.model'

export default class RateService {
    static async getAllRates() {
        return await RateModel.find({}).sort({ _id: -1 }).exec()
    }

    static async getRate(symbol: string) {
        const data = await RateModel.findOne({ symbol }).exec()
        return data
    }

    static async getRateLogs(symbol: string, begin: number, end: number) {
        if (begin > 0 && end > 0) {
            const filter: any = {
                symbol
            }
            const beginDate = unixTimestampToDate(begin)
            const endDate = unixTimestampToDate(end)
            filter.created = { $gt: beginDate, $lt: endDate }

            return await RateLogModel.find(filter).sort({ _id: -1 }).exec()
        }

        return await RateLogModel.find({ symbol }).sort({ _id: -1 }).limit(50).exec()
    }
}
