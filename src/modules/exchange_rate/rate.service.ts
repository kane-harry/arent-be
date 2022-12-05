import { unixTimestampToDate } from '@utils/utility'
import { RateLogModel, RateModel, TokenCandleModel } from './rate.model'
import { RateChartType } from '@config/constants'
import moment from 'moment'
import { TokenCandlesRO } from '@modules/exchange_rate/rate.dto'

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

    static async getCandles(symbol: string, type: string, begin: number, end: number) {
        type = type ?? RateChartType.OneMinute
        const filter: any = {
            symbol,
            type
        }

        let beginDate = begin ? unixTimestampToDate(begin) : moment().toDate()
        if (!begin) {
            switch (type) {
                case RateChartType.OneMinute:
                    beginDate = moment().subtract(1, 'hours').toDate()
                    break
                case RateChartType.FiveMinute:
                    beginDate = moment().subtract(24, 'hours').toDate()
                    break
                case RateChartType.ThirstyMinute:
                    beginDate = moment().subtract(7, 'days').toDate()
                    break
                case RateChartType.OneHour:
                    beginDate = moment().subtract(1, 'month').toDate()
                    break
                case RateChartType.OneDay:
                    beginDate = moment().subtract(1, 'year').toDate()
                    break
                default:
                    beginDate = moment().subtract(1, 'hours').toDate()
                    break
            }
        } else {
            beginDate = unixTimestampToDate(begin)
        }
        const endDate = end ? unixTimestampToDate(end) : moment().toDate()
        filter.created = { $gte: beginDate, $lte: endDate }
        const items = await TokenCandleModel.find(filter).sort({ _id: -1 }).exec()
        return new TokenCandlesRO(symbol, type, beginDate, endDate, items)
    }
}
