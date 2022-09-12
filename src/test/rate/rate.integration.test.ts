import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { dbTest } from '../init/db'
import { ExchangeRateProvider } from '@providers/rate.provider'

chai.use(chaiAsPromised)
describe('Rate', () => {
    before(async () => {
        await dbTest.connect()
    })

    after(async () => {
        await dbTest.disconnect()
    })

    it('InitDataForUser', async () => {
        const rateEth = await ExchangeRateProvider.getEthPrice('ETH-USDT')
        const ratePrime = await ExchangeRateProvider.getPrimePrice()
    }).timeout(10000)
})
