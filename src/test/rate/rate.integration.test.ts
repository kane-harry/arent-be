// @ts-nocheck
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { dbTest } from '../init/db'
import { ExchangeRateProvider } from '@providers/rate.provider'
import RateService from '@modules/exchange_rate/rate.service'
import { RateChartType } from '@config/constants'
import { TokenCandleModel } from '@modules/exchange_rate/rate.model'
import server from '@app/server'
import request from 'supertest'

chai.use(chaiAsPromised)
const { expect, assert } = chai
const type = RateChartType.OneMinute
describe('Rate', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('ExchangeRateProvider', async () => {
        const rateEth = await ExchangeRateProvider.getEthPrice('ETH-USDT')
        const ratePrime = await ExchangeRateProvider.getPrimePrice()
    }).timeout(10000)

    it('Create Token Candle', async () => {
        await RateService.fetchSpecificCandle(RateChartType.OneMinute)
        const items = await TokenCandleModel.find({ type: CandleType.OneMinute })
        expect(items.length).equal(2)
    }).timeout(10000)

    it('Get Rates', async () => {
        const res = await request(server.app).get(`/api/v1/rates`).send()
        expect(res.status).equal(200)
    }).timeout(10000)

    it('Get Token Candles', async () => {
        const symbol = 'ETH-USDT'
        const res = await request(server.app).get(`/api/v1/${symbol}/candles?type=${type}`).send()
        expect(res.status).equal(200)
        expect(res.body.symbol).equal('ETH')
        expect(res.body.currency).equal('USDT')
        expect(res.body.provider).equal('LightLink')
        expect(res.body.percent_changes).exist
        expect(res.body.items.length).gt(0)
    }).timeout(10000)
})
