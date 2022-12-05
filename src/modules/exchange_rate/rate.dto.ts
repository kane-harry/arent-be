import { roundUp } from '@utils/utility'
export class TokenCandlesRO {
    symbol: string
    currency: string
    provider: string
    type: string
    percent_changes: number
    begin_date: Date
    end_date: Date
    items: Array<any>

    constructor(symbol: any, type: any, beginDate: Date, endDate: Date, items: Array<any>) {
        this.symbol = symbol.split('-')[0]
        this.currency = symbol.split('-')[1]
        this.type = type
        this.begin_date = beginDate
        this.end_date = endDate
        this.provider = items.length ? items[0].provider : 'LightLink'
        const firstRate = items.length ? items[0].rate : 1
        const lastRate = items.length ? items[items.length - 1].rate : 1
        this.percent_changes = roundUp(((lastRate - firstRate) / firstRate) * 100, 4)
        this.items = items.map(i => {
            return { rate: i.rate, date: i.created }
        })
    }
}
