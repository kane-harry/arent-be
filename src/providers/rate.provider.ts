import { roundUp } from '@utils/utility'
import axios from 'axios'

const APIURL = 'https://api.kucoin.com/api/v1/market/orderbook/level1'

export class ExchangeRateProvider {
    public static async getEthPrice(symbol: string) {
        try {
            const resp = await axios.get(`${APIURL}?symbol=${symbol}`)
            if (resp.data && resp.data.code === '200000') {
                return parseFloat(resp.data.data.price)
            }
            return null
        } catch (err) {
            console.error(`get ETH Price error | ${err}`)
            return null
        }
    }

    public static async getPrimePrice() {
        return roundUp(0.03)
    }
}
