import IScheduler from '@interfaces/scheduler.interface'
import { RateModel, TokenCandleModel } from '@modules/exchange_rate/rate.model'
import cron from 'node-cron'
import { config } from '@config'

const primeSymbol = config.system.primeToken

export default class TokenCandlesScheduler implements IScheduler {
    constructor() {
        this.generateCandlesData()
    }

    private async generateCandlesData() {
        const types = {
            '1min': '* * * * *',
            '5min': '*/5 * * * *',
            '30min': '*/30 * * * *',
            '1hour': '0 * * * *',
            '1day': '0 0 * * *'
        }
        for (const [key, value] of Object.entries(types)) {
            this.generateSpecificCandles(key, value)
        }
    }

    private async generateSpecificCandles(type: string, period: string) {
        const tradingPairs = ['ETH-USDT', `${primeSymbol}-USDT`]

        const task = cron.schedule(period, async () => {
            console.log(`${new Date()} execute task - fetch candle type ${type} period ${period}`)

            for (const tradingPair of tradingPairs) {
                const data = await RateModel.findOne({ symbol: tradingPair }).exec()
                if (!data) {
                    continue
                }
                const exchangeRate = data.rate

                await new TokenCandleModel({ symbol: tradingPair, rate: exchangeRate, type }).save()
            }
        })
        task.start()
    }
}
