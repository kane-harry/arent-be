import IScheduler from '@interfaces/scheduler.interface'
import { RateLogModel, RateModel } from '@modules/exchange_rate/rate.model'
import { ExchangeRateProvider } from '@providers/rate.provider'
import cron from 'node-cron'
import { config } from '@config'
import { roundUp } from '@utils/utility'

const primeSymbol = config.system.primeToken

export default class RateScheduler implements IScheduler {
    constructor() {
        this.fetchRates()
    }

    private async fetchRates() {
        const task = cron.schedule('*/15 * * * *', async () => {
            console.log(`${new Date()} execute task - fetchRates`)
            const rates = await Promise.all([ExchangeRateProvider.getEthPrice(), ExchangeRateProvider.getPrimePrice()])
            const ethPrice = rates[0]
            const primePrice = rates[1]

            if (!ethPrice || !primePrice) {
                return
            }
            const usdtPrimeRate = roundUp(1 / primePrice, 8)
            const ethPrimeRate = roundUp(ethPrice / primePrice, 8)
            const primeEthRate = roundUp(1 / ethPrimeRate, 8)

            await RateModel.updateOne({ symbol: `${primeSymbol}-USDT` }, { $set: { rate: primePrice } }, { upsert: true }).exec()
            await new RateLogModel({ symbol: `${primeSymbol}-USDT`, rate: primePrice }).save()

            await RateModel.updateOne({ symbol: `USDT-${primeSymbol}` }, { $set: { rate: usdtPrimeRate } }, { upsert: true }).exec()
            await new RateLogModel({ symbol: `USDT-${primeSymbol}`, rate: usdtPrimeRate }).save()

            await RateModel.updateOne({ symbol: 'ETH-USDT' }, { $set: { rate: ethPrice } }, { upsert: true }).exec()
            await new RateLogModel({ symbol: 'ETH-USDT', rate: ethPrice }).save()

            await RateModel.updateOne({ symbol: `ETH-${primeSymbol}` }, { $set: { rate: ethPrimeRate } }, { upsert: true }).exec()
            await new RateLogModel({ symbol: `ETH-${primeSymbol}`, rate: ethPrimeRate }).save()

            await RateModel.updateOne({ symbol: `${primeSymbol}-ETH` }, { $set: { rate: primeEthRate } }, { upsert: true }).exec()
            await new RateLogModel({ symbol: `${primeSymbol}-ETH`, rate: primeEthRate }).save()
        })
        task.start()
    }
}
