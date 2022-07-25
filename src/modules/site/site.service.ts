import { PrimeCoinProvider } from '@providers/coin.provider'

export default class SiteService {
    static async coinServerHeartBeat() {
        return PrimeCoinProvider.coinServerHeartBeat()
    }
}
