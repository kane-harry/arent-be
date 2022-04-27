// import BizException from '@exceptions/biz.exception'
// import ErrorContext from '@exceptions/error.context'
import { PrimeCoinProvider } from '@providers/coin.provider'

export default class SiteService {
    static async coinServerHeartBeat() {
        return PrimeCoinProvider.coinServerHeartBeat()
    }
}
