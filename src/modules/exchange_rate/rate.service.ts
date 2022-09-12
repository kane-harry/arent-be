import { RateLogModel, RateModel } from './rate.model'

export default class RateService {
    static async getAllRates() {
        return await RateModel.find({}).sort({ _id: -1 }).exec()
    }

    static async getRate(symbol: string) {
        const data = await RateModel.findOne({ symbol }).exec()
        return data
    }

    static async getRateLogs(symbol: string) {
        return await RateLogModel.find({ symbol }).sort({ _id: -1 }).limit(50).exec()
    }
}
