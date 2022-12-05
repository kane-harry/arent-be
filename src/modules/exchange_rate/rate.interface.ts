import IBaseModel from '@interfaces/base.model.interface'

export interface IRate extends IBaseModel {
    symbol: string
    rate: number
}

export interface IRateLog extends IRate {
    provider: string
}

export interface ITokenCandle extends IRateLog {
    type: string
}
